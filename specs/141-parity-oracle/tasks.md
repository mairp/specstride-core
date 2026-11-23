---
description: "Task list of feature 141-parity-oracle"
---

# Tasks: Parity oracle (feature 141)

**Input**: Design documents from `specs/141-parity-oracle/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`. The order of construction of `plan.md` (R18 O-12) is kept: stubs and three families first, then the normalizer, then the exercise map and the remaining families, then the second suite.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US6)
- Every task names its file
- A test task carries `proves:` with what it proves; a parity test also `fixture:` and `surfaces:` (`spec.md` §O.6)
- An implementation task carries `covers:` with the requirements it serves
- A task that builds a fixture family carries `fixture:` and `surfaces:` of the catalogue

## What feature 141 builds, and what it does not

Feature 141 builds the package `@specstride/oracle`: reference fetch, the hermetic runner, the
stub kit, the fixture families with their first set of scenarios and golden captures, the
normalizer, the comparator, the waiver file, the register map, the exercise map, the second suite,
the release check, and the checks it adds to the coverage script. It builds no behaviour of the
product. The port side of a family passes when the feature that owns the behaviour is built; the
parity tests of that feature are tasks of that feature. Until then a family is proven with the
reference on both sides.

## Path Conventions

One package of the npm workspace, as in `plan.md`: `packages/oracle/`. Parity tests of this
feature: `tests/parity/141/`. Release checks: `tests/release/141/`. "Data files" are the files of
`specs/141-parity-oracle/contracts/`, copied into `packages/oracle/data/` by T003.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the package and its build jobs

- [x] T001 Create the package `@specstride/oracle` in packages/oracle/ with `package.json` (private, layer `dev`, no install script), `tsconfig.json`, `src/index.ts` and a `test` script that runs the test runner of Node
  - covers: F141-FR-045
- [x] T002 [P] Create the directories of `plan.md` under packages/oracle/ (`src/`, `stubs/`, `fixtures/`, `golden/`, `exercise-map/`, `reference/`, `test/`) and the empty waiver file packages/oracle/waivers.json
  - covers: F141-FR-022
- [x] T003 [P] Copy the data files and schemas of `specs/141-parity-oracle/contracts/` into packages/oracle/data/ and add `python3 specs/141-parity-oracle/contracts/tools/generate.py --check` to the build
  - covers: F141-FR-013; F141-FR-023
- [x] T004 Create the four build jobs `hermetic`, `capture`, `reference` and `platform` in .github/workflows/oracle.yml; no job calls a model; the jobs `capture` and `reference` take the clones of the baselines from two variables of the job and never write to them
  - covers: F141-FR-025; F141-FR-037; F141-FR-038

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: what every story needs: validated data, the reference trees, the empty environment, the library of the stubs

**⚠️ CRITICAL**: no story can start before this phase is done

- [x] T005 Load and validate every data file and schema of packages/oracle/data/ at start, with typed readers, in packages/oracle/src/catalogue/data.ts
  - covers: F141-FR-012; F141-FR-013
- [x] T006 [P] Test CT-141-101 (pins: two systems, commit and tree hash; the state of a clone has no effect; Lisa has no pin) in packages/oracle/test/reference/pins.test.ts
  - proves: F141-FR-001
- [x] T007 Write the pins in packages/oracle/reference/pins.json and their reader in packages/oracle/src/reference/pins.ts
  - covers: F141-FR-001
- [x] T008 [P] Test CT-141-102 (reference trees: archive into scratch, tree hash, read-only, unchanged after a run, a clone on another branch with uncommitted changes stays as it was, no cache of the interpreter in the tree) in packages/oracle/test/reference/fetch.test.ts
  - proves: F141-FR-002
- [x] T009 Implement the fetch, the verification, the read-only tree, the check after every run and the copy for a fixture with its own install-root file in packages/oracle/src/reference/fetch.ts
  - covers: F141-FR-002
- [x] T010 [P] Test CT-141-103 (empty environment: only the allow-list reaches a run; stubs stand first on the search path; fresh home and temporary directory; the port receives the as-is variables through the alias table of feature 100) in packages/oracle/test/env/hermetic.test.ts
  - proves: F141-FR-003
- [x] T011 Implement the empty environment with its allow-list and the mapping through the environment alias table of `@specstride/contracts` in packages/oracle/src/env/hermetic.ts
  - covers: F141-FR-003
- [x] T012 [P] Test CT-141-138 (no paid or external call: a connection beyond loopback fails the run; a credential variable of the machine never reaches a run) in packages/oracle/test/env/network-guard.test.ts
  - proves: F141-FR-038
- [x] T013 Implement the network guard and the credential guard in packages/oracle/src/env/guard.ts
  - covers: F141-FR-038
- [x] T014 [P] Test CT-141-105 (rules of a stub: no clock, no randomness, counter outside the working directory, one record per call, a call beyond the script fails with the fixed code) in packages/oracle/test/stubs/rules.test.ts
  - proves: F141-FR-005
- [x] T015 Implement the library of the stubs: script reader, invocation counter, transcript writer, overrun, in packages/oracle/stubs/lib/
  - covers: F141-FR-005; F141-FR-011

**Checkpoint**: the reference trees can be produced and a stub can be scripted

---

## Phase 3: User Story 1 - The author of a feature cites the oracle (Priority: P1) 🎯 MVP

**Goal**: the catalogue, the verbs, the surfaces and the declaration of a test are data that a check enforces

**Independent Test**: for any kept row of the traceability files, a declaration written from `spec.md` §O.2 to §O.6 alone is accepted by the declaration check

### Tests for User Story 1

- [x] T016 [P] [US1] Test CT-141-112 (fixture declaration: a missing field, an unknown verb or surface refuses the fixture; imported assets carry their licence notice; a file of state in a template is laid out by its logical name on each side, and a physical path of the port's state refuses the fixture) in packages/oracle/test/catalogue/fixture-declaration.test.ts
  - proves: F141-FR-012
- [x] T017 [P] [US1] Test CT-141-113 (catalogue: 40 ids, ids stable, FX-37 retired and refused, every active family has scope, reference, stubs, surfaces and features; every scenario of FX-06, FX-07 and FX-17 to FX-20 that the catalogue gives an end on the reference has an entry point, an end, a stop reason, an evidence line and `run` or `read`) in packages/oracle/test/catalogue/catalogue.test.ts
  - proves: F141-FR-013
- [x] T018 [P] [US1] Test CT-141-127 (declaration of a test: names of §O.6; refusal of a family outside the catalogue, a retired family, an unknown scenario, a surface outside the family) in packages/oracle/test/catalogue/test-declaration.test.ts
  - proves: F141-FR-027
- [x] T019 [P] [US1] Test CT-141-128 (behaviour with no reference: a parity test of pi, of a harness without a tested harness adapter or of a Lisa behaviour is refused; the generic stub and the pi stub are offered) in packages/oracle/test/catalogue/no-reference.test.ts
  - proves: F141-FR-028
- [x] T020 [P] [US1] Test CT-141-130 (added scenarios: accepted inside the scope with known verbs and surfaces; refused otherwise; names unique; a scenario that the catalogue holds has the name it has there and the feature that owns it; a scenario that the catalogue does not hold carries the number of the feature) in packages/oracle/test/catalogue/added-scenario.test.ts
  - proves: F141-FR-030

### Implementation for User Story 1

- [x] T021 [US1] Implement the catalogue of families and scenarios with status, variants and the scenarios a feature added, in packages/oracle/src/catalogue/catalogue.ts
  - covers: F141-FR-013; F141-FR-030
- [x] T022 [US1] Implement the validation of `fixture.json` and the import of as-is assets with their licence notice in packages/oracle/src/catalogue/fixture.ts and packages/oracle/fixtures/assets/NOTICE
  - covers: F141-FR-012
- [x] T023 [US1] Implement the declaration check of parity tests and characterization tests, reading `tasks.md` of every feature and the tests under tests/parity/, in packages/oracle/src/catalogue/declarations.ts
  - covers: F141-FR-027; F141-FR-028
- [x] T024 [P] [US1] Publish the citing rules for authors of tests: a page generated from the data files in packages/oracle/CITING.md, equal to `spec.md` §O.1 to §O.7
  - covers: F141-FR-027

**Checkpoint**: a feature can cite the oracle and have its declarations checked

---

## Phase 4: User Story 2 - A developer compares the port with the reference (Priority: P1)

**Goal**: one scenario runs on both sides in the empty environment and gives a result per surface

**Independent Test**: FX-01 `three-phases` with the reference on both sides is `equal` on every surface; one seeded byte gives `different` on that surface

### Tests for User Story 2

- [x] T025 [P] [US2] Test CT-141-104 (the port runs under the profile `parity` by ordinary configuration; nothing else is set; the engine stub is named through row 41; a switch, variable or code path for the oracle alone fails) in packages/oracle/test/run/profile.test.ts
  - proves: F141-FR-004
- [x] T026 [P] [US2] Test CT-141-106 (names of stub executables: as-is commands and `stub-harness`; the set is data; a fixture that enumerates harnesses reads the registry) in packages/oracle/test/stubs/names.test.ts
  - proves: F141-FR-006
- [x] T027 [P] [US2] Test CT-141-107 (proposer stub: exactly the eleven verbs; no verb declares a unit of work or writes a checkpoint; the argument `state` of `write` changes a file of state by its logical name on each side) in packages/oracle/test/stubs/proposer.test.ts
  - proves: F141-FR-007
- [x] T028 [P] [US2] Test CT-141-108 (critic stub: two request shapes over HTTP and the CLI; the verbs; the nonce comes from the prompt; both forms of the `completion` level; a prompt without a nonce is the diagnostician; the argument `choices: none` of `empty` in the second request shape, which T159 builds) in packages/oracle/test/stubs/critic.test.ts
  - proves: F141-FR-008
- [x] T029 [P] [US2] Test CT-141-109 (engine stub, verification command stubs, plugin installer stub, telemetry sink stub: the verbs of each) in packages/oracle/test/stubs/others.test.ts
  - proves: F141-FR-009
- [x] T030 [P] [US2] Test CT-141-111 (transcript: fields, names of variables and never values, transport-neutral form of a critic call, no argument that continues a session) in packages/oracle/test/stubs/transcript.test.ts
  - proves: F141-FR-011
- [x] T031 [P] [US2] Test CT-141-119 (capture: every surface S-01 to S-13, and S-14 to S-16 on the port; standard output and standard error apart; state by logical name; taken after the run ended) in packages/oracle/test/capture/surfaces.test.ts
  - proves: F141-FR-019
- [x] T032 [P] [US2] Test CT-141-120 (normalizer: one test per rule N-01 to N-29 on recorded input of the reference, and for the rules that act on the capture of the port alone (N-12, N-29) on input in the port's form that the test holds; counts per rule as F141-FR-020 defines them; a rule that replaces nothing fails the suite; no table of its own) in packages/oracle/test/normalize/rules.test.ts
  - proves: F141-FR-020
- [x] T033 [P] [US2] Test CT-141-121 (comparator: three results; a missing capture is `different`; the assertions before normalization (nonce, order of time, hashes)) in packages/oracle/test/compare/comparator.test.ts
  - proves: F141-FR-021
- [x] T034 [P] [US2] Test CT-141-122 (waivers: keyed by fixture, surface and row; a waiver without a register row that says waiver is refused; a waiver that matches nothing fails the suite; a waiver never reaches another fixture or surface) in packages/oracle/test/waivers/waivers.test.ts
  - proves: F141-FR-022
- [x] T035 [P] [US2] Test CT-141-123 (register map: one entry per row of the register, 119 on 2026-09-30; a row without an entry, an entry that names something that does not exist, or a disagreement with the register fails the suite) in packages/oracle/test/register/register-map.test.ts
  - proves: F141-FR-023
- [x] T036 [P] [US2] Test CT-141-124 (a line that only the port prints gives `different`; no rule and no waiver removes it; the first suite compares compatibility output) in packages/oracle/test/compare/new-only-line.test.ts
  - proves: F141-FR-024
- [x] T037 [P] [US2] Test CT-141-144 (self-proof: reference against itself is `equal` on every surface; a seeded difference is `different`; the same fixture twice gives the same normalized capture; the feasibility probe) in packages/oracle/test/self/self-proof.test.ts
  - proves: F141-FR-044
- [x] T038 [P] [US2] Parity test PT-141-011SC008-greeting-fixtures in tests/parity/141/greeting-fixtures.test.ts: the scenarios `greeting-ready` and `greeting-blocked` give on the port what the reference gives
  - proves: 011 SC-008
  - requirement: F141-FR-018
  - fixture: FX-32/greeting-ready, FX-32/greeting-blocked
  - surfaces: exit, stdout, stderr, tree, state

### Implementation for User Story 2

- [x] T039 [P] [US2] Implement the proposer stub with its eleven verbs, and the argument `state` of `write`, in packages/oracle/stubs/lib/proposer.ts
  - covers: F141-FR-007
- [x] T040 [P] [US2] Implement the critic stub over HTTP with the two request shapes, and the diagnostician part, in packages/oracle/stubs/critic-http/server.ts
  - covers: F141-FR-008
- [x] T041 [P] [US2] Implement the critic stub as a CLI in packages/oracle/stubs/lib/critic-cli.ts
  - covers: F141-FR-008
- [x] T042 [P] [US2] Implement the engine stub and the verification command stubs in packages/oracle/stubs/lib/engine.ts and packages/oracle/stubs/lib/verification.ts
  - covers: F141-FR-009
- [x] T043 [P] [US2] Implement the telemetry sink stub in packages/oracle/stubs/sink/server.ts
  - covers: F141-FR-009
- [x] T044 [US2] Create the stub executables for Claude and the generic harness, and the engine executable, as Node-shebang files in packages/oracle/stubs/bin/, from the names of `stub-vocabulary.json`
  - covers: F141-FR-006; F141-FR-010
- [x] T045 [US2] Implement the transport-neutral form of a transcript and the assertion that no invocation continued a session in packages/oracle/src/capture/transcript.ts
  - covers: F141-FR-011
- [x] T046 [US2] Implement the driver of one side: steps of commands, the profile `parity` for the port, row 41 for the engine stub, the layout of the state files of a template by logical name and the path that the argument `state` of `write` resolves to, the list of processes left behind, in packages/oracle/src/run/driver.ts
  - covers: F141-FR-004; F141-FR-012; F141-FR-019
- [x] T047 [P] [US2] Implement the static check that the product offers nothing for the oracle alone and that the product package holds no file of the oracle, in packages/oracle/src/release/no-oracle-path.ts
  - covers: F141-FR-004; F141-FR-045
- [x] T048 [US2] Implement the capture of the surfaces `exit`, `stdout`, `stderr`, `tree`, `state`, `events`, `processes`, `home` in packages/oracle/src/capture/ (one module per surface)
  - covers: F141-FR-019
- [x] T049 [P] [US2] Implement the capture of the surfaces `pipeline`, `telemetry`, `repository`, `launcher` in packages/oracle/src/capture/
  - covers: F141-FR-019
- [x] T050 [P] [US2] Implement the capture of the port-only surfaces `events-primary`, `control-records`, `counters` in packages/oracle/src/capture/port-only.ts
  - covers: F141-FR-019
- [x] T051 [US2] Build FX-01 `three-phases`, FX-02 `reject-approve` and FX-35 `dry-run@engine-stub` with the reference on both sides, in packages/oracle/fixtures/FX-01/, packages/oracle/fixtures/FX-02/ and packages/oracle/fixtures/FX-35/ (step 1 of the order of construction)
  - fixture: FX-01/three-phases, FX-02/reject-approve, FX-35/dry-run@engine-stub
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home; for FX-35 also pipeline, launcher
  - covers: F141-FR-045; F141-FR-013
- [x] T052 [US2] Implement the rules N-01 to N-08 and the reading of the layout tables of feature 100, with counts per rule, in packages/oracle/src/normalize/ (one module per rule; step 2 of the order of construction)
  - covers: F141-FR-020
- [x] T053 [P] [US2] Implement the rules N-09 to N-11 (the three classes of hash) with their recomputation in packages/oracle/src/normalize/hashes.ts
  - covers: F141-FR-020; F141-FR-021
- [x] T054 [P] [US2] Implement the rules N-12 to N-14 (events: projection, typing and duplicate keys, order inside a class of writer) in packages/oracle/src/normalize/events.ts
  - covers: F141-FR-020
- [x] T055 [P] [US2] Implement the rules N-15 to N-20 (component names, generated-by fields, the launcher as a logical record, messages and literals of the old languages, output labels) in packages/oracle/src/normalize/text.ts
  - covers: F141-FR-020
- [x] T056 [P] [US2] Implement the rules N-21 to N-29 (colour, objects of the repository, counter files and transcripts, prompt text, caches, telemetry payloads, locale, legacy state, the field `schema` of a reverse-run source inventory) in packages/oracle/src/normalize/rest.ts
  - covers: F141-FR-020
- [x] T057 [US2] Implement the rule that a normalization rule which replaces nothing in any fixture fails the suite, and the report of counts, in packages/oracle/src/normalize/report.ts
  - covers: F141-FR-020
- [x] T058 [US2] Implement the assertions before normalization in packages/oracle/src/compare/assertions.ts
  - covers: F141-FR-021
- [x] T059 [US2] Implement the comparator and the report of results (`schemas/result.schema.json`) in packages/oracle/src/compare/comparator.ts
  - covers: F141-FR-021; F141-FR-024
- [x] T060 [US2] Implement the waiver file, its matching and its two failures in packages/oracle/src/waivers/waivers.ts
  - covers: F141-FR-022
- [x] T061 [US2] Implement the register map, its check against `docs/ecosystem/consolidation.md` section 6, and the use of the mode map, the exit-code map of `resume`, the key-name map and the argument tables of the harness adapters, in packages/oracle/src/register/register-map.ts
  - covers: F141-FR-023
- [x] T062 [P] [US2] Build the scenarios of FX-32 (Derivation of a launch contract) in packages/oracle/fixtures/FX-32/: `greeting-ready`, `greeting-blocked`, `ambiguous-feature`, `tasks-unreadable-by-old-grammar`; each with `fixture.json`, the template of the working directory and no script of a stub (the family has none); capture the golden captures on the reference; import the two as-is greeting projects and their expectations as assets
  - fixture: FX-32
  - surfaces: exit, stdout, stderr, tree, state
  - covers: F141-FR-018; F141-FR-013
- [x] T063 [US2] Implement the self-proof commands (`--sides reference,reference`, `--seed-difference <surface>`, `probe`) in packages/oracle/src/run/self.ts
  - covers: F141-FR-044

**Checkpoint**: one scenario gives `equal`, `waived` or `different` per surface

---

## Phase 5: User Story 3 - The release is held until every parity test passes (Priority: P1)

**Goal**: one check says whether a release may go out

**Independent Test**: with one surface `different`, one skip, or no macOS result, the release check says "blocked" and names the cause

### Tests for User Story 3

- [x] T064 [P] [US3] Test CT-141-125 (golden captures: stored in normalized form without a path, account or name of a machine; the capture job fails when a golden capture differs from a fresh one; no reference tree in the repository; on macOS the confirmed Linux captures are used) in packages/oracle/test/golden/golden.test.ts
  - proves: F141-FR-025
- [x] T065 [P] [US3] Test CT-141-126 (release condition: blocked on `different`, on a failed self-check, on a failed or skipped parity test of any feature, on a failed second suite, on a missing live run; the fixtures of dsh, Codex and prime are inside) in packages/oracle/test/release/release-check.test.ts
  - proves: F141-FR-026
- [x] T066 [P] [US3] Test CT-141-135 (per-OS expectations: the data; on macOS the port is compared with the Linux capture; every expectation is `inferred`) in packages/oracle/test/release/per-os.test.ts
  - proves: F141-FR-035
  - status: unverified until the platform job has run on macOS
- [x] T067 [P] [US3] Test CT-141-136 (macOS runner: without a passing run the release check blocks and says that macOS statements are `unverified`; the first run is reported as a research result) in tests/release/141/macos-runner.test.ts
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F141-FR-036
  - status: unverified until the platform job has run on macOS
- [x] T068 [P] [US3] Test CT-141-137 (test tiers: hermetic, reference and platform run apart; a missing prerequisite is a skip with its reason; at the release check a skip blocks; the release run meets every declared prerequisite, and `FX-26/root-sandbox-assertion` is captured on the reference and run on the port with the effective user id 0) in packages/oracle/test/release/tiers.test.ts
  - proves: F141-FR-037

### Implementation for User Story 3

- [x] T069 [US3] Implement the store of golden captures and the comparison of the port with them in packages/oracle/src/golden/store.ts
  - covers: F141-FR-025
- [x] T070 [US3] Implement the capture job: fresh capture of the reference, comparison with the golden captures, scan for a path, account or name of the machine, in packages/oracle/src/golden/capture-job.ts
  - covers: F141-FR-025
- [x] T071 [P] [US3] Implement the three test tiers and the skip with its reason, and the disposable environment of the reference tier in which a scenario whose prerequisite is the effective user id 0 (`FX-26/root-sandbox-assertion`) runs on both sides at the release run, in packages/oracle/src/run/tiers.ts
  - covers: F141-FR-037
- [x] T072 [P] [US3] Implement the per-OS expectations from `per-os-expectations.json` in packages/oracle/src/release/per-os.ts
  - covers: F141-FR-035
- [x] T073 [US3] Implement the release check: it reads the reports of both suites, of the parity tests of every feature, of the live run and of the platform run, in packages/oracle/src/release/release-check.ts
  - covers: F141-FR-026; F141-FR-036
- [x] T074 [P] [US3] Write the procedure of the first macOS run and the form of its report (which expectations held) in tests/release/141/macos-first-run.md
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F141-FR-036

**Checkpoint**: the release check blocks and names its cause

---

## Phase 6: User Story 4 - A reviewer checks what a test claims (Priority: P2)

**Goal**: the exercise map, the claim check, the correction list, the coverage script; then the remaining families in the order of clusters not yet covered

**Independent Test**: a test whose fixture did not execute the evidence line of an item it claims fails the claim check by name

### Tests for User Story 4

- [x] T075 [P] [US4] Test CT-141-117 (inventory supplement: two rows with the fields of an inventory row; the evidence lines hold the two write sites at the pinned commit; the exercise map treats them as items) in packages/oracle/test/trace/supplement.test.ts
  - proves: F141-FR-017
- [x] T076 [P] [US4] Test CT-141-131 (exercise map: shell parts and Python parts of both baselines; a capture with tracing equals one without) in packages/oracle/test/trace/exercise-map.test.ts
  - proves: F141-FR-031
  - status: unverified for the Python parts until the capture job has run with tracing
- [x] T077 [P] [US4] Test CT-141-132 (claim check: an item needs its evidence line executed; the rule for a cluster; a failing claim names the test and the item) in packages/oracle/test/trace/claims.test.ts
  - proves: F141-FR-032
- [x] T078 [P] [US4] Test CT-141-133 (correction list: items that no fixture executed, items executed by another family than the one named; the traceability files are never written) in packages/oracle/test/trace/corrections.test.ts
  - proves: F141-FR-033
- [x] T079 [P] [US4] Test CT-141-134 (coverage script: every kept row is named by a test of its feature; every id exists; every `fixture:` names an active family; claims pass where a map exists; failure exits non-zero) in packages/oracle/test/trace/coverage-script.test.ts
  - proves: F141-FR-034

### Implementation for User Story 4

- [x] T080 [US4] Add the two rows of `inventory-supplement.tsv` to the exercise map as items in packages/oracle/exercise-map/supplement.tsv and verify their evidence lines against the reference tree
  - covers: F141-FR-017
- [x] T081 [P] [US4] Implement line tracing of the shell parts of the reference in packages/oracle/src/trace/shell.ts
  - covers: F141-FR-031
- [x] T082 [P] [US4] Implement line tracing of the Python parts of the reference in packages/oracle/src/trace/python.ts
  - covers: F141-FR-031
- [x] T083 [US4] Implement the exercise map (`schemas/exercise-map.schema.json`) in packages/oracle/src/trace/map.ts
  - covers: F141-FR-031
- [x] T084 [US4] Implement the claim check for items and clusters in packages/oracle/src/trace/claims.ts
  - covers: F141-FR-032
- [x] T085 [US4] Implement the correction list for the orchestrator in packages/oracle/src/trace/corrections.ts, written to packages/oracle/exercise-map/corrections.tsv
  - covers: F141-FR-033
- [x] T086 [US4] Add to the coverage script docs/ecosystem/check-traceability.py: the check of `fixture:` against the catalogue, the claim check against the exercise map, fixture families above FX-37 in check g (the script accepts FX-38 to FX-40 since 2026-09-29; confirm it), and in check d the number of register rows read from the register in place of the constant, which expects 117 rows while the register holds 119 since 2026-09-30, so that scenario 15 of `quickstart.md` can pass (the change is written out in `analyze-report.md`, "Proposed upstream fixes", P1; if the orchestrator has applied it, confirm it)
  - covers: F141-FR-034
- [x] T087 [P] [US4] Build the scenarios of FX-03 (Reject limit reached) in packages/oracle/fixtures/FX-03/: `reject-limit`, `reject-limit-of-one`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-03
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T088 [P] [US4] Build the scenarios of FX-04 (Oscillation) in packages/oracle/fixtures/FX-04/: `oscillation-halt`, `oscillation-below-threshold`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-04
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T089 [P] [US4] Build the scenarios of FX-05 (MALFORMED variants and limit) in packages/oracle/fixtures/FX-05/: `no-verdict`, `wrong-nonce`, `duplicate-verdict`, `empty-reply`, `malformed-limit`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-05
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T090 [P] [US4] Build the scenarios of FX-08 (Diagnostician and accelerator) in packages/oracle/fixtures/FX-08/: `new-signature-hint`, `same-signature-no-second-hint`, `accelerated-attempt`, `diagnostician-fails`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, diagnostician, proposer; capture the golden captures on the reference
  - fixture: FX-08
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T091 [P] [US4] Build the scenarios of FX-09 (Spec resolution order and ambiguity) in packages/oracle/fixtures/FX-09/: `explicit-path`, `feature-flag`, `single-candidate`, `ambiguous-candidates`, `no-candidate`; each with `fixture.json`, the template of the working directory and no script of a stub (the family has none); capture the golden captures on the reference
  - fixture: FX-09
  - surfaces: exit, stdout, stderr, tree, state
  - covers: F141-FR-013; F141-FR-012
- [x] T092 [P] [US4] Build the scenarios of FX-10 (Three spec formats, invalid spec) in packages/oracle/fixtures/FX-10/: `native`, `speckit-tasks`, `openspec-change`, `invalid-spec`, `unknown-format`, `explicit-openspec`; each with `fixture.json`, the template of the working directory and no script of a stub (the family has none); capture the golden captures on the reference
  - fixture: FX-10
  - surfaces: exit, stdout, stderr, tree
  - covers: F141-FR-013; F141-FR-012
- [x] T093 [P] [US4] Build the scenarios of FX-11 (Lock held) in packages/oracle/fixtures/FX-11/: `second-run-refused`, `lock-form`, `stale-lock`, `orphaned-child`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-11
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T094 [P] [US4] Build the scenarios of FX-12 (Stop request at each check point) in packages/oracle/fixtures/FX-12/: `stop-before-phase`, `stop-between-passes`, `stop-during-yield`, `stop-now`, `stop-with-no-run`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-12
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T095 [P] [US4] Build the scenarios of FX-13 (Resume and replay of settings) in packages/oracle/fixtures/FX-13/: `resume-after-reject-limit`, `resume-pinned-keys`, `resume-lock-held`, `resume-nothing-to-resume`, `resume-tunable-key-in-environment`, `resume-unsaved-setting`, `snapshot-write-fails`, `planted-approval-marker`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-13
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T096 [P] [US4] Build the scenarios of FX-14 (Verification modes) in packages/oracle/fixtures/FX-14/: `mode-off`, `mode-plan`, `mode-required-pass`, `mode-required-fail`, `generate-tests-upgrades-off`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer, verification-command; capture the golden captures on the reference
  - fixture: FX-14
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T097 [P] [US4] Build the scenarios of FX-15 (Release verification failure) in packages/oracle/fixtures/FX-15/: `release-verification-fails`, `release-verification-passes`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer, verification-command; capture the golden captures on the reference
  - fixture: FX-15
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T098 [P] [US4] Build the scenarios of FX-16 (Pre-staged and detached verification commands) in packages/oracle/fixtures/FX-16/: `pre-staged-reused`, `pre-staged-stale`, `long-job-running`, `long-job-finished`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer, verification-command; capture the golden captures on the reference
  - fixture: FX-16
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T099 [P] [US4] Build the scenarios of FX-17 (Iteration limit) in packages/oracle/fixtures/FX-17/: `iteration-limit`, `iteration-returned-by-yield`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference; enter the end that the capture shows for `iteration-returned-by-yield` in the table "Ends on the reference" of `spec.md` §O.2, which has no row for it yet (F141-FR-013)
  - fixture: FX-17
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T100 [P] [US4] Build the scenarios of FX-19 (No progress) in packages/oracle/fixtures/FX-19/: `no-progress-legacy`, `no-progress-structured-not-evaluated`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-19
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T101 [P] [US4] Build the scenarios of FX-20 (Hard cap kills) in packages/oracle/fixtures/FX-20/: `cap-exhausted-legacy`, `cap-exhausted-structured`, `kill-note-carried`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference; enter the end that the capture shows for `kill-note-carried` in the table "Ends on the reference" of `spec.md` §O.2, which has no row for it yet (F141-FR-013)
  - fixture: FX-20
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T102 [P] [US4] Build the scenarios of FX-21 (Idle, progress and repetition watchdogs) in packages/oracle/fixtures/FX-21/: `idle-timeout`, `progress-stall`, `repeat-stall`, `crash-reads-clean`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-21
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T103 [P] [US4] Build the scenarios of FX-22 (Yield) in packages/oracle/fixtures/FX-22/: `predicate-<kind>` (6 members, `spec.md` §O.2, "Members of the pattern names"), `yield-limit`, `yield-deadline`, `yield-refused`, `yield-timeout`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer, verification-command; capture the golden captures on the reference
  - fixture: FX-22
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T104 [P] [US4] Build the scenarios of FX-23 (Wall-clock budget) in packages/oracle/fixtures/FX-23/: `wall-budget`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-23
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T105 [P] [US4] Build the scenarios of FX-24 (Short-pass nudge) in packages/oracle/fixtures/FX-24/: `short-pass-nudge`, `yield-leaves-counter`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-24
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-012
- [x] T106 [P] [US4] Build the scenarios of FX-27 (Commit after approval) in packages/oracle/fixtures/FX-27/: `commit-per-phase`, `commits-off`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-27
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home, repository
  - covers: F141-FR-013; F141-FR-012
- [x] T107 [P] [US4] Build the scenarios of FX-28 (Front-door inspection commands) in packages/oracle/fixtures/FX-28/: `<command>-<case>` (20 members, `spec.md` §O.2, "Members of the pattern names"); each with `fixture.json`, the template of the working directory and no script of a stub (the family has none); capture the golden captures on the reference
  - fixture: FX-28
  - surfaces: exit, stdout, stderr, tree, state
  - covers: F141-FR-013; F141-FR-012
- [x] T108 [P] [US4] Build the scenarios of FX-29 (Learning) in packages/oracle/fixtures/FX-29/: `show`, `advise-no-telemetry`, `apply`, `revert`, `off`, `evaluate`, `below-sample-floor`, `quarantined`; each with `fixture.json`, the template of the working directory and no script of a stub (the family has none); capture the golden captures on the reference
  - fixture: FX-29
  - surfaces: exit, stdout, stderr, state, events
  - covers: F141-FR-013; F141-FR-012
- [x] T109 [P] [US4] Build the scenarios of FX-30 (Reverse) in packages/oracle/fixtures/FX-30/: `plan`, `lint-<code>` (38 members, `spec.md` §O.2, "Members of the pattern names"), `guard-refuses`, `refused-flag`; each with `fixture.json`, the template of the working directory and the scripts of the stubs engine, proposer; capture the golden captures on the reference
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
  - covers: F141-FR-013; F141-FR-012
- [x] T110 [P] [US4] Build the scenarios of FX-31 (Telemetry shippers against a local sink) in packages/oracle/fixtures/FX-31/: `loki-payload`, `otlp-payload`, `sink-down`, `metric-names`, `delivery-status`; each with `fixture.json`, the template of the working directory and the scripts of the stubs telemetry-sink; capture the golden captures on the reference
  - fixture: FX-31
  - surfaces: exit, stderr, telemetry, state
  - covers: F141-FR-013; F141-FR-012
- [x] T111 [P] [US4] Build the scenarios of FX-33 (Validate and promote) in packages/oracle/fixtures/FX-33/: `valid`, `invalid-<class>` (10 members, `spec.md` §O.2, "Members of the pattern names"; annex X §X.6 row 274; `invalid-not-promoted` through the entry point `launcher-render`, the other nine through `contract-validate`), `stale-sources`, `learning-decisions-changed`, `promote`; each with `fixture.json`, the template of the working directory and no script of a stub (the family has none); capture the golden captures on the reference
  - fixture: FX-33
  - surfaces: exit, stdout, stderr, state
  - covers: F141-FR-013; F141-FR-012
- [x] T112 [P] [US4] Build the scenarios of FX-34 (Render) in packages/oracle/fixtures/FX-34/: `render`, `edited-launcher`, `bundle-reused`, `stale`; each with `fixture.json`, the template of the working directory and no script of a stub (the family has none); capture the golden captures on the reference
  - fixture: FX-34
  - surfaces: exit, stdout, stderr, launcher, state
  - covers: F141-FR-013; F141-FR-012
- [x] T113 [P] [US4] Build the remaining scenarios of FX-01 and FX-02 that name no harness other than Claude in packages/oracle/fixtures/FX-01/ and packages/oracle/fixtures/FX-02/: `single-phase`, `harness-claude`, `defaults-no-role-named`, `reject-twice-approve`, `archive-collision`
  - fixture: FX-01, FX-02
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013
- [x] T114 [US4] Write the waivers of the first set into packages/oracle/waivers.json, one per scenario that the catalogue marks, each with its selector: DV-004, DV-009, DV-022, DV-024, DV-029, DV-032, DV-058, DV-060, DV-073, DV-075, DV-107, DV-112; the waiver of DV-112 only for a scenario in which the prime stub is called; a waiver is written when its scenario is built, so those of DV-009, DV-032, DV-075 and DV-112 follow T124 to T135 of phase 7
  - covers: F141-FR-022

**Checkpoint**: every claim is checked, and every family that needs no further harness has its first set

---

## Phase 7: User Story 6 - Scenarios for dsh, Codex and prime (Priority: P2)

**Goal**: the scenarios of the three harnesses, the plugin protocol, the overlay, the terminal, and the launcher and supervisor families in both variants

**Independent Test**: on a machine with none of the three harnesses installed, every scenario that names one of them runs on the reference and gives a capture

### Tests for User Story 6

- [x] T115 [P] [US6] Test CT-141-110 (harness stubs: the calling convention and the records of Claude, dsh, Codex, prime, pi and the generic stub; the pi stub on the port side only; a further harness stub is added by data) in packages/oracle/test/stubs/harness-stubs.test.ts
  - proves: F141-FR-010
- [x] T116 [P] [US6] Test CT-141-114 (new families: FX-38 covers the 27 items of the plugin protocol; FX-39 declares an overlay through the as-is variable; FX-40 runs on a pseudo-terminal; each names its reservation) in packages/oracle/test/catalogue/new-families.test.ts
  - proves: F141-FR-014
- [x] T117 [P] [US6] Test CT-141-115 (scenarios of dsh, Codex and prime: present in FX-01, FX-06, FX-07, FX-18, FX-25, FX-26, FX-38, FX-39; the reference needs only stubs; no scenario encodes an `unverified` fact) in packages/oracle/test/catalogue/harness-scenarios.test.ts
  - proves: F141-FR-015
  - status: unverified facts of dsh and Codex are captured by features 130 and 131
- [x] T118 [P] [US6] Test CT-141-116 (FX-35 and FX-36: every scenario runs as `@engine-stub` and as `@full-stack`) in packages/oracle/test/catalogue/variants.test.ts
  - proves: F141-FR-016
- [x] T119 [P] [US6] Test CT-141-129 (locally registered backend: no fixture, no stub name, no imported asset; the entry is found at run time; its name is in no file of the oracle, golden captures included) in packages/oracle/test/catalogue/not-carried-entry.test.ts
  - proves: F141-FR-029

### Implementation for User Story 6

- [x] T120 [US6] Create the harness stubs of dsh, Codex, prime (agent and launcher) and pi as executables in packages/oracle/stubs/bin/ with their calling conventions in packages/oracle/stubs/lib/harness/
  - covers: F141-FR-010; F141-FR-006
- [x] T121 [US6] Implement the plugin installer stub as the dsh stub called with the installer's arguments in packages/oracle/stubs/lib/harness/dsh-installer.ts
  - covers: F141-FR-009
- [x] T122 [US6] Implement the handling of a registry entry that the port does not carry: found at run time, taken out before storage and comparison, and the scan of the files of the oracle, in packages/oracle/src/normalize/not-carried-entry.ts
  - covers: F141-FR-029
- [x] T123 [P] [US6] Import the as-is input streams of the Claude format and of the prime format as assets, without the assets of the locally registered backend, in packages/oracle/fixtures/assets/streams/
  - covers: F141-FR-012; F141-FR-029
- [x] T124 [P] [US6] Build the harness scenarios of FX-01 in packages/oracle/fixtures/FX-01/: `harness-dsh`, `harness-dsh-model-override`, `harness-codex`, `harness-prime`, `harness-prime-variant`, `harness-generic`
  - fixture: FX-01
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-015; F141-FR-028
- [x] T125 [P] [US6] Build the scenarios of FX-06 (Critic transport failure) in packages/oracle/fixtures/FX-06/: `http-error`, `http-hang`, `cli-nonzero-exit`, `cli-empty-output`, `dsh-error-on-stdout`, `prime-critic-error`, each of which ends on the reference with engine exit 1 and the stop reason `critic_unavailable`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-cli, critic-http, proposer; capture the golden captures on the reference; the scenarios of dsh, Codex and prime included
  - fixture: FX-06
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-015; F141-FR-013
- [x] T126 [P] [US6] Build the scenarios of FX-07 (Critic configuration error) in packages/oracle/fixtures/FX-07/: `missing-key`, `unknown-harness-name`, `dsh-conflicting-providers`, `dsh-invalid-model-ref`, `prime-empty-variant`, `codex-missing-key`, each of which ends on the reference with engine exit 1 and the stop reason `critic_unavailable` and not with engine exit 3 (the scenarios that reach engine exit 3 are built by T153); each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-cli, critic-http, proposer; capture the golden captures on the reference; the scenarios of dsh, Codex and prime included
  - fixture: FX-07
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-015; F141-FR-013
- [x] T127 [P] [US6] Build the scenarios of FX-18 (Consecutive errors) in packages/oracle/fixtures/FX-18/: `consecutive-errors-legacy`, `consecutive-errors-structured`, `harness-missing-dsh`, `harness-missing-prime`, `harness-missing-prime-launcher`, `dsh-model-and-qualifier`, `dsh-no-provider`, `prime-variant-with-model`, `dsh-overlay-cannot-build`, each with the end that the table "Ends on the reference" of `spec.md` §O.2 gives it: pass-loop exit 7 on the structured path, pass-loop exit 8 on the plain-output path; the script of `consecutive-errors-legacy` uses the verb `silent`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference; the scenarios of dsh, Codex and prime included
  - fixture: FX-18
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-015; F141-FR-013
- [x] T128 [P] [US6] Build the scenarios of FX-25 (Grounding snapshot) in packages/oracle/fixtures/FX-25/: `file-cap`, `byte-budget`, `wildcard-match`, `placeholder`, `missing-file`, `window-per-harness`, `evidence-cites-state-path`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-cli, critic-http, proposer; capture the golden captures on the reference; the scenarios of dsh, Codex and prime included
  - fixture: FX-25
  - surfaces: exit, stderr, state, events, transcript
  - covers: F141-FR-015; F141-FR-013
- [x] T129 [P] [US6] Build the scenarios of FX-26 (Stream formats through the seam) in packages/oracle/fixtures/FX-26/: `claude-<name>` (18 members, `spec.md` §O.2, "Members of the pattern names"), `prime-v3-<name>` (10 members, `spec.md` §O.2, "Members of the pattern names"), `dsh-text`, `codex-text`, `generic-text`, `fallback-<reason>` (3 members, `spec.md` §O.2, "Members of the pattern names"), `pass-through`; each with `fixture.json`, the template of the working directory and the scripts of the stubs generic, proposer; capture the golden captures on the reference; the scenarios of dsh, Codex and prime included
  - fixture: FX-26
  - surfaces: exit, stdout, stderr, state, events, transcript
  - covers: F141-FR-015; F141-FR-013
- [x] T130 [P] [US6] Build the scenarios of FX-38 (dsh plugin request protocol) in packages/oracle/fixtures/FX-38/: `no-request-file`, `installed-then-restart`, `installed-on-final-pass`, `allowlist-empty`, `denied-not-in-allowlist`, `invalid-request-<case>` (10 members, `spec.md` §O.2, "Members of the pattern names"), `installer-fails`, `installer-times-out`, `request-and-evidence-in-one-pass`, `qualified-harness-never-processed`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, plugin-installer, proposer; capture the golden captures on the reference
  - fixture: FX-38
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-014; F141-FR-015
- [x] T131 [P] [US6] Build the scenarios of FX-39 (Declared overlay of the configuration home) in packages/oracle/fixtures/FX-39/: `scope-pass`, `scope-attempt`, `scope-attempt-signal`, `invalid-declaration`, `populate-fails`, `dsh-settings-overlay`, `dsh-reasoning-effort`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-cli, generic, proposer; capture the golden captures on the reference
  - fixture: FX-39
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-014; F141-FR-015
- [x] T132 [P] [US6] Implement the driver of a pseudo-terminal of fixed size in packages/oracle/src/run/pty.ts
  - covers: F141-FR-014
  - status: unverified on macOS
- [x] T133 [P] [US6] Build the scenarios of FX-40 (Rendering on a terminal) in packages/oracle/fixtures/FX-40/: `banner`, `timeline-live`, `colour-detected`, `colour-never`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, proposer; capture the golden captures on the reference
  - fixture: FX-40
  - surfaces: exit, stdout, stderr
  - covers: F141-FR-014
- [x] T134 [P] [US6] Build the scenarios of FX-35 (Launcher and pipeline runtime) in packages/oracle/fixtures/FX-35/: `dry-run`, `preflight-fails`, `stages-complete`, `stage-fails`, `stage-timeout`, `in-stage-retry`, `pipeline-resume`, `signal-<name>` (3 members, `spec.md` §O.2, "Members of the pattern names"), `lock-held`, `second-pipeline-on-held-workspace`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, engine, proposer; capture the golden captures on the reference; every scenario as `@engine-stub` and as `@full-stack`
  - fixture: FX-35
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home, pipeline, launcher
  - covers: F141-FR-016; F141-FR-013
- [x] T135 [P] [US6] Build the scenarios of FX-36 (Supervisor) in packages/oracle/fixtures/FX-36/: `mode-<case>` (9 members, `spec.md` §O.2, "Members of the pattern names"), `mode-no-execution-phrasing`, `learning-selection`, `gate-<refusal>` (10 members, `spec.md` §O.2, "Members of the pattern names"), `gate-attach`, `launch`, `observe-<status>` (7 members, `spec.md` §O.2, "Members of the pattern names"), `relaunch-<decision>` (31 members, `spec.md` §O.2, "Members of the pattern names"), `stop`, `retro`; each with `fixture.json`, the template of the working directory and the scripts of the stubs critic-http, engine, proposer; capture the golden captures on the reference; every scenario as `@engine-stub` and as `@full-stack`
  - fixture: FX-36
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home, pipeline
  - covers: F141-FR-016; F141-FR-013

**Checkpoint**: every active family has its first set of scenarios and golden captures

---

## Phase 8: User Story 5 - The micro-loop layer is inert (Priority: P2)

**Goal**: the second suite

**Independent Test**: on a build whose layer changes one counter or writes one unnamed field, the second suite fails and reports a possible breach of gate integrity

**Needs**: the micro-loop layer of feature 115 on the port

### Tests for User Story 5

- [x] T136 [P] [US5] Test CT-141-139 (second suite: every fixture unchanged; the profile `parity` with row 1 set to `micro` and nothing else; the stubs never declare a unit of work; captures A and B with the surfaces S-14 to S-16) in packages/oracle/test/suite2/config.test.ts
  - proves: F141-FR-039
- [x] T137 [P] [US5] Test CT-141-140 (layer allowlist: generated from the register rows that name a layer field; an entry that matches nothing fails; a difference outside fails and is reported as a possible breach of gate integrity; what is not reachable is listed with its reason; event types are those of the catalogue of feature 111 and files of state are named by logical name, `phase:<N>:manifest` and `phase:<N>:protected-set` for DV-052, and `run:<runId>:task-list` is no entry) in packages/oracle/test/suite2/allowlist.test.ts
  - proves: F141-FR-040
- [x] T138 [P] [US5] Test CT-141-141 (counters: equal per phase in A and B; exit codes, stop reasons and run states of B are subsets of those of A) in packages/oracle/test/suite2/counters.test.ts
  - proves: F141-FR-041
- [x] T139 [P] [US5] Test CT-141-142 (a fixture whose verification gate does not execute: the classic loop with the reason `gate-not-executing`; the announcement is the only difference) in packages/oracle/test/suite2/gate-not-executing.test.ts
  - proves: F141-FR-042
- [x] T140 [P] [US5] Test CT-141-143 (owner decisions and known tensions: continuation off and asserted; the reset flag in FX-13; the mode map with one waiver; the defaults fixture waived; no quota signal; staleness at the as-is point; glob expansion without a waiver) in packages/oracle/test/suite2/decisions.test.ts
  - proves: F141-FR-043

### Implementation for User Story 5

- [x] T141 [US5] Implement the runner of the second suite, which changes row 1 of the profile and nothing else, in packages/oracle/src/suite2/runner.ts
  - covers: F141-FR-039
- [x] T142 [US5] Implement the generation of the layer allowlist from the register map and `layer-allowlist.json`, its matching and its failures; the values of an entry come from `layer-allowlist.json`, which follows the catalogue of feature 111 and annex B §B.5 where the text of a register row names a value otherwise (`analyze-report.md`, "Proposed upstream fixes", P2 and P3), in packages/oracle/src/suite2/allowlist.ts
  - covers: F141-FR-040
- [x] T143 [P] [US5] Implement the counter assertion and the subset assertion in packages/oracle/src/suite2/counters.ts
  - covers: F141-FR-041
- [x] T144 [P] [US5] Implement the expectation for fixtures whose verification gate does not execute in packages/oracle/src/suite2/classic-fallback.ts
  - covers: F141-FR-042
- [x] T145 [US5] Pass the reset flag in the resume scenarios of FX-13 on the port, and drive modes through the mode map in FX-36, in packages/oracle/src/run/decisions.ts
  - covers: F141-FR-043

**Checkpoint**: both suites run

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: what spans the stories

- [x] T146 [P] Test CT-141-145 (packaging and order: the product package holds no file of the oracle, no stub and no fixture; the steps of the order of construction are recorded as done in order) in packages/oracle/test/release/packaging.test.ts
  - proves: F141-FR-045
- [x] T147 [P] Measure the performance goals of `plan.md` in the build (one scenario on each side, the hermetic test tier, the reference test tier, one normalization) and record the values in packages/oracle/PERFORMANCE.md
  - covers: plan.md, "Performance Goals"
- [x] T148 Run the scenarios of `quickstart.md` 1 to 15 and record the result in packages/oracle/VALIDATION.md
  - covers: F141-FR-044
  - checks: F141-SC-001 to F141-SC-010
- [x] T149 [P] Report to the orchestrator, as a file packages/oracle/exercise-map/REPORT.md: the correction list, the two supplementary rows, the families FX-38 to FX-40 for the proof column of the traceability files
  - covers: F141-FR-017; F141-FR-033

---

## Phase 10: Follow-up after the fan-out (2026-09-29)

**Purpose**: what the other features reported after this task list was written. No task above was
renumbered. The scenarios below are in `spec.md` §O.2, in the table "Scenarios added after the first
set"; the ends are in the table "Ends on the reference".

### Tests of the follow-up

- [x] T150 [P] [US6] Test CT-141-146 (ends on the reference: for every scenario of FX-06, FX-07 and FX-17 to FX-20 that the catalogue gives an end, the capture of the reference shows that exit code and that stop reason; a capture that differs fails the capture job and names the scenario) in packages/oracle/test/catalogue/ends-on-reference.test.ts
  - proves: F141-FR-013
  - fixture: FX-06, FX-07, FX-17, FX-18, FX-19, FX-20
  - surfaces: exit, events
- [x] T151 [P] [US1] Test CT-141-147 (register of scenario names: every pattern name has members and every member matches its pattern; every scenario names the feature that owns it; a name used twice in a family fails; a scenario of another feature that the catalogue holds is accepted by the declaration check under the name it has there) in packages/oracle/test/catalogue/scenario-register.test.ts
  - proves: F141-FR-030
- [x] T152 [P] [US6] Test CT-141-148 (the presenter, the banner and the theme tool are driven as entry points of FX-40 where the front door does not reach a behaviour; the pseudo-terminal has the size the fixture names and answers the background query from the fixture) in packages/oracle/test/run/presenter-entry.test.ts
  - proves: F141-FR-014

### Implementation of the follow-up

- [x] T153 [P] [US6] Build the scenarios added to FX-07 (Critic configuration error) in packages/oracle/fixtures/FX-07/: `phase-not-found`, `critic-spec-missing`, `critic-format-invalid`, `critic-phase-not-found`, `critic-plan-invalid`, `critic-evidence-missing`; `phase-not-found` ends with engine exit 3 and the stop reason `critic_config`; the five others drive the critic and end with critic exit 3; capture the golden captures on the reference
  - fixture: FX-07
  - surfaces: for `phase-not-found` exit, stdout, stderr, tree, state, events, transcript, processes, home; for the five scenarios that drive the critic exit, stdout, stderr, state (`spec.md` §O.2, "Scenarios added after the first set")
  - covers: F141-FR-015; F141-FR-013
- [x] T154 [P] [US6] Build the scenarios added to FX-18 (Consecutive errors) in packages/oracle/fixtures/FX-18/: `unknown-harness-name`, `prime-empty-variant`; capture the golden captures on the reference
  - fixture: FX-18
  - surfaces: exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-015; F141-FR-013
- [x] T155 [P] [US4] Build the scenario `flag-without-value` of FX-28 in packages/oracle/fixtures/FX-28/ and the scenario `invalid-allowlist-entry` of FX-38 in packages/oracle/fixtures/FX-38/; capture the golden captures on the reference
  - fixture: FX-28, FX-38
  - surfaces: for `FX-28/flag-without-value` exit, stdout, stderr; for `FX-38/invalid-allowlist-entry` exit, stdout, stderr, tree, state, events, transcript, processes, home
  - covers: F141-FR-013; F141-FR-014
- [x] T156 [P] [US6] Build the scenarios added to FX-35 (Launcher and pipeline runtime) in packages/oracle/fixtures/FX-35/: `stale-sources`, `invalid-launch-contract`, `colour-always`, `colour-never`, `setup-without-implement`, `precondition-fails`; and to FX-36 (Supervisor) in packages/oracle/fixtures/FX-36/: `observe-cadence`; every scenario as `@engine-stub` and as `@full-stack`; capture the golden captures on the reference
  - fixture: FX-35, FX-36
  - surfaces: as `spec.md` §O.2, "Scenarios added after the first set", gives each scenario: for `stale-sources` and `invalid-launch-contract` exit, stdout, stderr, tree, state, events, transcript, processes, home, pipeline, launcher; for `colour-always` and `colour-never` exit, stdout, stderr, pipeline; for `setup-without-implement`, `precondition-fails` and `FX-36/observe-cadence` exit, stdout, stderr, tree, state, events, transcript, processes, home, pipeline
  - covers: F141-FR-016; F141-FR-030
- [x] T157 [US6] Extend the driver of one side so that a scenario of FX-40 can name the presenter, the banner or the theme tool as its entry point, with the size of the pseudo-terminal and the answer to the background query as data of the fixture, in packages/oracle/src/run/entry-points.ts
  - covers: F141-FR-014
  - status: unverified on macOS
- [x] T158 [P] [US6] Build the scenarios added to FX-40 (Rendering on a terminal) in packages/oracle/fixtures/FX-40/: `banner-width-full`, `banner-width-compact`, `banner-width-line`, `banner-flags`, `banner-motion-off`, `banner-switched-off`, `colour-depth-16`, `colour-depth-256`, `colour-depth-truecolor`, `colour-forced`, `colour-override`, `background-set`, `background-query`, `theme-usage`, `glyphs-ascii`, `timeline-events`, `timeline-detail-milestones`, `timeline-detail-full`, `timeline-debug`, `timeline-no-terminal`, `timeline-stop-requested`, `timeline-narrow`, `card`, `card-stop-resume`; capture the golden captures on the reference
  - fixture: FX-40
  - surfaces: exit, stdout, stderr
  - covers: F141-FR-014
- [x] T159 [P] [US2] Add the argument `choices: none` of the verb `empty` to the critic stub over HTTP, for the second request shape, in packages/oracle/stubs/critic-http/
  - covers: F141-FR-008
- [x] T160 [US1] Register in the catalogue the scenarios that other features own (21 names on 2026-09-30, of the features 106, 107, 109, 123 and 131), the names that feature 103 reserves, and the two requests that are no scenario of a family; make the declaration check accept a registered scenario of another feature, in packages/oracle/src/catalogue/scenario-register.ts
  - covers: F141-FR-030; F141-FR-027
- [x] T161 [US4] Make the capture job compare the end of every scenario with the end that the catalogue states, and fail on a difference, in packages/oracle/src/golden/ends.ts
  - covers: F141-FR-013
- [x] T162 [P] Report to the orchestrator the item-by-item changes of the proof column of the traceability files: `specs/141-parity-oracle/followup/proof-column-changes.tsv` for the families FX-38 to FX-40, and `followup/proof-column-corrections-other.tsv` for the assignments that the reading of the baselines corrected; repeat the report when the exercise map has run
  - covers: F141-FR-033

**Checkpoint**: `python3 specs/141-parity-oracle/contracts/tools/generate.py --check` passes; every scenario of the catalogue names the feature that owns it

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends on |
|---|---|
| 1 Setup | Nothing |
| 2 Foundational | Phase 1; the data of feature 100 in `@specstride/contracts` |
| 3 US1 | Phase 2 |
| 4 US2 | Phase 2; US1 for the validation of `fixture.json` |
| 5 US3 | US2 |
| 6 US4 | US2 |
| 7 US6 | US2; the exercise map of US4 confirms the assignments |
| 8 US5 | US2, and the micro-loop layer of feature 115 on the port |
| 9 Polish | All stories |
| 10 Follow-up | US1 for T151 and T160; US2 for T159; US4 for T161; US6 for the rest |

### Dependencies on other features

| What | Feature | Until it exists |
|---|---|---|
| Normalization tables, layout tables, the `parity` profile | 100 | T011 of phase 2 (the environment alias table) and everything of phase 4 cannot start |
| The port side of a family | The features of the column "Features covered" of the catalogue | The family is proven with the reference on both sides and with golden captures |
| The compatibility projection | 111 | The surface `events` of the port is `different` |
| Compatibility output | 119, 123 | The surfaces `stdout` and `stderr` of the port are `different` |
| The argument tables of the harness adapters | 125, 130, 131, 138 | The surface `transcript.proposer` of the port is `different` for that harness |
| The micro-loop layer | 115 | Phase 8 cannot pass |
| A count above 0 for every normalization rule, a match for every waiver and for every allowlist entry (F141-SC-010) | Every family built, and the port side of the families on which N-12, N-29, the waivers and the allowlist act | The three failures are proven on seeded input by CT-141-120, CT-141-122 and CT-141-140; over the whole catalogue they are judged at the release check |

### Within Each User Story

- A test task is written first and fails before its implementation task is done
- Stubs before fixtures; fixtures before golden captures; the normalizer before the comparator
- The exercise map before the remaining families (R18 O-12)
- Two tests span phases. T029 (CT-141-109) holds the cases of the plugin installer stub, which T121 builds in phase 7: until then they are a skip with that reason. T115 (CT-141-110) holds the cases of the Claude stub and of the generic stub, which T044 builds in phase 4: those cases are written before T044, the cases of dsh, Codex, prime and pi before T120

### Parallel Opportunities

- Every task marked [P] inside one phase
- The tasks that build a fixture family are independent of each other: each writes its own directory
- US3, US4 and US6 can run side by side once US2 is done

## Parallel Example: User Story 4

```text
Task: "Build the scenarios of FX-09 (Spec resolution order and ambiguity) in packages/oracle/fixtures/FX-09/"
Task: "Build the scenarios of FX-14 (Verification modes) in packages/oracle/fixtures/FX-14/"
Task: "Build the scenarios of FX-29 (Learning) in packages/oracle/fixtures/FX-29/"
```

## Implementation Strategy

### MVP First

1. Phases 1 and 2
2. Phase 3 (US1): the other features can cite the oracle and have declarations checked
3. Phase 4 (US2) up to the first three scenarios with the reference on both sides
4. **Stop and validate**: scenarios 1 to 6 of `quickstart.md`

### Incremental Delivery

1. US1, US2: one scenario compares
2. US3: the release check exists and blocks
3. US4: claims are checked; the families that need no further harness
4. US6: the harness scenarios and the new families
5. US5: the second suite, once the layer exists

## As-is coverage

| As-is id | Disposition | Requirement | Test task |
|---|---|---|---|
| 011 SC-008 | translated | F141-FR-018 | PT-141-011SC008-greeting-fixtures |

