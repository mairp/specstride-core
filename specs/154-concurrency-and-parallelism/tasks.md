# Tasks: Concurrency and parallelism (feature 154)

**Input**: design documents from `specs/154-concurrency-and-parallelism/`

**Prerequisites**: spec.md (81 requirements, G0 to G8; every ruling answered), plan.md (its
"Change map", "Rule-id sets", "Seams", "Ruling dependencies"), data-model.md (D1 to D14),
contracts/ (11 schemas, 10 rule tables, `fixtures-154.json`, `closed-set-deltas.md`),
quickstart.md, research.md, analyze-report.md, constitution-grounding.md.

**Tests**: requested, as spec 153 requested them. Each slice writes its failing test on its
fixture first and makes it pass next; a test task names the F154-FR or F154-SC it proves and what
"done" means. A **guard test** proves something the code already does and may pass at once.

**Granularity**: one task changes one file in one place and does one thing. A test case, a key,
a row of a table, a step of a wiring sequence, a field of a record: each is its own task.

**Phase size**: at most 20 tasks, and every phase ends at a checkpoint that can be verified alone
on its fixture. A user story spans several phases; the story label says which.

**`[P]` markers**: none. The honest ceiling of the marker on this repository's lists is 1.25 at
two workers once order, a named path and no overlap are required (R-M12, R-M13), and the shared
files of the engine (`run-feature.ts`, `parallel-*.ts`) are touched in order by one pass at a
time. Core-only phases are marked "core only" in their heading: they can run beside an engine
phase.

**Branch of a ruling**: every task is written for the recommended answer of its ruling; a task
that would change under the other answer names that branch in one line.

**IDs**: T001 to T172, in execution order within each phase.

## Format: `[ID] [Story] Description (file:symbol — what it serves — done when)`

## Path Conventions

- Pure tables (no file-system import): `packages/core/src/<group>/<table>.ts`, `packages/layer-parallel/src/<table>.ts`.
- Edge (files, processes): `packages/runtime/src/limits/*.ts`.
- Wiring: `packages/cli/src/engine/*.ts`, `packages/pipeline/src/**/*.ts`.
- Tests: `tests/parallel/154/` (rule tests, property tests), `tests/inertness/154/` (switches off, `parity`), `tests/fixtures/154/` (the fixtures), and each package's `test/`.
- Contracts: `packages/<pkg>/data/` holds the copy of a `contracts/` file; the data test pins its bytes.

## Coverage map

Generated from the citations of this file. Every requirement of spec.md has a task; a requirement with no task is a defect of this file.

- F154-FR-001: T009, T010, T013, T015, T169
- F154-FR-002: T002, T010, T116, T163, T169, T170
- F154-FR-003: T002, T003, T004, T005, T006, T007, T008, T113, T169, T171
- F154-FR-004: T002, T008, T012, T027, T093, T113, T169
- F154-FR-005: T002, T008, T012, T027, T093, T110, T113, T165, T169
- F154-FR-006: T002, T008, T012, T016, T027, T084, T093, T110, T113, T164, T169
- F154-FR-007: T001, T002, T008, T012, T027, T093, T110, T113, T169
- F154-FR-008: T008, T012, T027, T043, T093, T110, T113, T167, T169
- F154-FR-009: T008, T012, T027, T028, T031, T032, T034, T043, T093, T110, T113, T169
- F154-FR-010: T008, T012, T027, T028, T029, T032, T043, T093, T110, T113, T169
- F154-FR-011: T008, T012, T027, T029, T043, T093, T110, T113, T169
- F154-FR-012: T008, T012, T017, T027, T038, T039, T040, T043, T093, T110, T113, T169
- F154-FR-013: T008, T012, T017, T027, T037, T039, T040, T043, T093, T110, T113, T169
- F154-FR-014: T008, T012, T017, T027, T039, T040, T043, T093, T110, T113, T169
- F154-FR-015: T008, T012, T027, T040, T043, T086, T093, T110, T113, T148, T169
- F154-FR-016: T008, T012, T027, T036, T040, T043, T093, T110, T113, T148, T169
- F154-FR-017: T008, T012, T027, T040, T043, T093, T110, T113, T148, T169
- F154-FR-018: T008, T011, T027, T041, T042, T043, T044, T093, T110, T113, T148, T161, T169
- F154-FR-019: T008, T027, T042, T093, T110, T113, T148
- F154-FR-020: T008, T020, T022, T027, T045, T046, T047, T093, T110, T113, T148
- F154-FR-021: T008, T027, T051, T052, T053, T093, T110, T113, T148
- F154-FR-022: T008, T027, T053, T054, T055, T093, T110, T113, T148
- F154-FR-023: T008, T027, T053, T056, T093, T110, T113, T148
- F154-FR-024: T008, T027, T053, T057, T058, T093, T110, T113, T148
- F154-FR-025: T008, T021, T027, T048, T049, T053, T093, T110, T113, T148
- F154-FR-026: T008, T018, T027, T053, T059, T060, T061, T093, T110, T113, T148
- F154-FR-027: T008, T018, T027, T053, T062, T063, T093, T110, T113, T148
- F154-FR-028: T008, T018, T027, T053, T064, T065, T066, T093, T110, T113, T148
- F154-FR-029: T008, T018, T027, T053, T070, T071, T093, T110, T113, T148
- F154-FR-030: T008, T018, T027, T053, T068, T069, T093, T110, T113, T148
- F154-FR-031: T008, T018, T027, T053, T073, T076, T093, T110, T113, T148
- F154-FR-032: T008, T018, T027, T053, T072, T074, T075, T076, T093, T110, T113, T148
- F154-FR-033: T008, T027, T053, T093, T110, T113, T148
- F154-FR-034: T008, T027, T078, T079, T080, T083, T093, T110, T113, T148
- F154-FR-035: T008, T027, T079, T080, T093, T110, T113, T148
- F154-FR-036: T008, T019, T027, T081, T082, T093, T110, T113, T148
- F154-FR-037: T008, T027, T087, T093, T110, T113, T148
- F154-FR-038: T008, T027, T088, T093, T110, T113, T148
- F154-FR-039: T008, T026, T027, T090, T093, T094, T110, T113, T148
- F154-FR-040: T008, T026, T027, T090, T093, T096, T097, T110, T113, T148
- F154-FR-041: T008, T026, T027, T090, T093, T107, T108, T109, T110, T113, T148
- F154-FR-042: T008, T026, T027, T090, T093, T098, T099, T108, T110, T113, T148
- F154-FR-043: T008, T023, T024, T025, T026, T027, T090, T093, T108, T110, T113, T148
- F154-FR-044: T008, T026, T027, T089, T090, T091, T092, T093, T108, T110, T113, T148
- F154-FR-045: T008, T102, T103, T104, T105, T106, T110, T113, T148
- F154-FR-046: T008, T100, T101, T110, T113, T148
- F154-FR-047: T008, T110, T113, T148
- F154-FR-048: T008, T112, T113, T114, T115, T116, T148
- F154-FR-049: T117, T118, T119, T148
- F154-FR-050: T117, T121, T122, T125, T148
- F154-FR-051: T117, T125, T148
- F154-FR-052: T117, T126, T148
- F154-FR-053: T117, T123, T127, T148
- F154-FR-054: T117, T127, T148
- F154-FR-055: T117, T120, T148
- F154-FR-056: T117, T129, T130, T131, T132, T148
- F154-FR-057: T117, T135, T136, T148
- F154-FR-058: T117, T133, T134, T135, T136, T137, T148
- F154-FR-059: T117, T133, T134, T138, T148
- F154-FR-060: T117, T139, T148
- F154-FR-061: T117, T144, T148
- F154-FR-062: T117, T142, T143, T145, T148
- F154-FR-063: T117, T142, T143, T145, T147, T148
- F154-FR-064: T117, T142, T143, T145, T147, T148
- F154-FR-065: T117, T142, T143, T145
- F154-FR-066: T117, T142, T143, T145
- F154-FR-067: T117, T146
- F154-FR-068: T117, T146, T151
- F154-FR-069: T084, T117, T140, T146, T152
- F154-FR-070: T117, T146, T153
- F154-FR-071: T117, T146, T154
- F154-FR-072: T117, T146
- F154-FR-073: T117, T146, T156
- F154-FR-074: T117, T146, T149, T157
- F154-FR-075: T117, T146, T149, T157
- F154-FR-076: T117, T149, T157, T158
- F154-FR-077: T117, T149, T157, T159
- F154-FR-078: T117, T149, T157, T160
- F154-FR-079: T025, T117, T124, T128, T149, T157
- F154-FR-080: T149
- F154-FR-081: T162, T168

Success criteria:
- F154-SC-001: T163, T170, T172
- F154-SC-002: T030, T033
- F154-SC-003: T050, T085
- F154-SC-004: T149
- F154-SC-005: T085, T137
- F154-SC-006: T077, T104
- F154-SC-007: T094
- F154-SC-008: T123
- F154-SC-009: T035
- F154-SC-010: T067
- F154-SC-011: T062, T067
- F154-SC-012: T013, T014, T015, T033
- F154-SC-013: T141
- F154-SC-014: T068

## Phase 1: Setup — the contracts as data (core only)

**Goal**: every record, table and fixture of the design exists as data with its bytes pinned.
**Checkpoint**: `node tests/isolate.ts <node> --test packages/*/test/data-154*.test.ts` passes; no source file changed.

- [x] T001 Copy the 11 schemas of `specs/154-concurrency-and-parallelism/contracts/schemas/` into `packages/contracts/schemas/154/` byte for byte (F154-FR-007); done when `ls` shows 11 files and `diff -r` is empty.
- [x] T002 Write `packages/contracts/test/schemas-154.test.ts`: parses each schema of T001, asserts draft 2020-12, a `$id` of the form `specstride.<name>/1`, `additionalProperties: false` on every record, and that no schema names an exit code, stop reason, run state or attempt kind (F154-FR-002, -007); done when it passes.
- [x] T003 Copy `independence-table.json`, `repeat-table.json`, `merge-check-outcome-table.json` and `worker-check-table.json` into `packages/layer-parallel/data/` and write `packages/layer-parallel/src/tables.ts` with `INDEPENDENCE_TABLE`, `REPEAT_TABLE`, `MERGE_CHECK_OUTCOME_TABLE`, `WORKER_CHECK_TABLE` imported as JSON (F154-FR-003).
- [x] T004 Write `packages/layer-parallel/test/data-154.test.ts`: pins the bytes of the four tables of T003 against `specs/154-concurrency-and-parallelism/contracts/rule-tables/` and asserts every rule id of plan.md "Rule-id sets" is a row (PG-0 to PG-3, RP-1, RP-2, MG-1 to MG-3, WC-1 to WC-4); done when it passes. (F154-FR-003).
- [x] T005 Copy `slot-admission-table.json` into `packages/core/data/` and write `packages/core/src/host-limits/tables.ts` (`SLOT_ADMISSION_TABLE`); copy `landing-table.json` and write `packages/core/src/landing/tables.ts`; copy `validation-queue-table.json` and write `packages/core/src/phase-queue/tables.ts` (F154-FR-003).
- [x] T006 Copy `speculation-table.json` and `trial-pass-mark-table.json` into `packages/core/data/` and write `packages/core/src/speculation/tables.ts` and `packages/core/src/trial/tables.ts` (F154-FR-003).
- [x] T007 Write `packages/core/test/tables-154.test.ts`: pins the bytes of the five tables of T005 and T006 and asserts the rule ids SL-1 to SL-5, LD-1 to LD-4, PQ-1 to PQ-3, SP-1 to SP-6, TRI-1 to TRI-3; done when it passes. (F154-FR-003).
- [x] T008 Copy `stage-admission-table.json` into `packages/pipeline/data/` and write `packages/pipeline/src/executor/tables.ts`; write `packages/pipeline/test/tables-154.test.ts` pinning its bytes and SG-1 to SG-4 (F154-FR-003, -048).
- [x] T009 Write the nine switch rows of spec.md "Rows of the `parity` profile" into `packages/contracts/data/parity-profile.json` `switches[]`, each `default: "off"` and `valueUnderParity: "off"`, except `loop.parallel.noRepeat` (`on` with `loop.parallel.units`), each naming its output fields; no `Register row` id (the register ends at DV-120, its map at DV-122: the owner assigns ids) (F154-FR-001).
- [x] T010 Write `packages/contracts/test/parity-154.test.ts`: asserts the nine rows of T009 exist, their parity value is `off`, and that the closed-set members `repeat`, `dependency`, `group-check`, `host_slot` are NOT yet in `closed-sets.json` (a proposal is not a member until the owner copies it) (F154-FR-001, -002); done when it passes.
- [x] T011 Write `tests/fixtures/154/README.md` and the fixture directories `plan/`, `groups/`, `slots/`, `stages/`, `phases/`, `spec/`, `door/` from `contracts/fixtures-154.json`, each with its `tasks.md`, launch contract and stub configuration (F154-FR-018); done when each holds the files its fixture entry names.
- [x] T012 Write the fallback reasons of F154-FR-004 as constants in `packages/layer-parallel/src/preconditions.ts`: `dependency-unreadable` beside `harness`; a **guard test** in `packages/layer-parallel/test/preconditions.test.ts` proves the unreadable slot store is not a layer reason (it is SL-5) (F154-FR-004, -017).
- [x] T013 Write `packages/layer-parallel/test/inertness-154.test.ts`: for every fixture of T011, `planAtLaunch` with every switch off returns a plan with no groups and `fallback` set; done when it passes (F154-SC-012, F154-FR-001).
- [x] T014 Write `tests/inertness/154/switches-off.test.ts`: runs the stub engine of `packages/cli/test/engine/loop-speed-helpers.ts` on `tests/fixtures/154/groups/` with every switch off and asserts no `parallel.admission`, `host.slot.*`, `pipeline.landing.*` or `loop.speculation.*` event exists and no slot or hold file is written under the temporary user-state root (F154-SC-012).
- [x] Record the baseline run of `tests/fixtures/154/groups/` with the feature absent (`main` @ `aafb367f`: the stub engine, every switch off) into `tests/fixtures/154/parity-baseline/` as the event files of the run; done when the directory holds them and its README names the commit (F154-SC-012).
- [x] T015 Write `tests/inertness/154/parity.test.ts`: the same run under the `parity` profile, asserting the event files are byte-identical to a run with the feature absent (the baseline is the recorded run of the same fixture on `main` @ `aafb367f`) (F154-FR-001, F154-SC-012).
- [x] T016 Write `tests/inertness/154/governance.test.ts`: a **guard test** that one critic call per phase, a nonce-bound verdict and one approval record exist on the fixture of T014 (F154-FR-006); it must pass before and after every later phase.
- [x] Write `packages/core/test/trial-pass-mark.test.ts`: the failing test of `passMarkOf`: TRI-1, TRI-2 and TRI-3 each fail on their own, and all three true pass (F154-FR-018).
- [x] Write `packages/core/src/trial/pass-mark.ts`: `passMarkOf` over `TRI_TABLE`, returning `pass` or `fail` with the failing rule id (F154-FR-018); done when the test before it passes.
- [x] T017 Write `packages/core/src/report/rows-154.ts` types for the new report rows from `report-rows-154.schema.json` (`windowShares`, `inPassCheckTimeOutsidePasses`, `groups`, `speculation`) (F154-FR-012, -014, -015, -064).
- [x] T018 Write `packages/layer-parallel/src/types.ts` additions: `repeat` and `dependency` in `ADMISSION_CHECKS` behind a `PROPOSED_154` flag that reads `loop.parallel.noRepeat` and `loop.parallel.groupUnits` (a member exists only when its switch is on) (F154-FR-026, -032).
- [x] T019 Write `packages/core/src/parallel/audits.ts`: `group-check` in `DELTA_REFUSAL_REASONS` behind the `loop.parallel.groupCheck` reader of T018's pattern, and `isADeltaRefusalReason` extended; a **guard test** in `packages/core/test/audits-154.test.ts` proves the list is unchanged when the switch is off (F154-FR-036, CQ-154-09).

**Checkpoint**: Phase 1. `node tests/isolate.ts <node> --test packages/contracts/test/*154*.test.ts packages/layer-parallel/test/*154*.test.ts packages/core/test/*154*.test.ts packages/pipeline/test/tables-154.test.ts` is green; `git diff --stat` shows no file under `packages/cli/src/` or `packages/runtime/src/`.

## Phase 2: Foundational — the seams of `runFeature` (US2, setup)

**Goal**: `runFeature` takes every input of the design by name, with today's behaviour as the default, so that each later phase changes one seam.
**Checkpoint**: `packages/cli/test/engine/parallel-wiring.test.ts` and the Phase 1 tests pass unchanged.

- [x] T020 In `packages/cli/src/engine/parallel-wiring.ts` `ParallelWiringInput` (:384-453) add the optional seams `groupsOfThePhase`, `groupGateOfTheAttempt`, `quotaObservationOf`, `failedGroupsBeforeOfTheLedger`, `repeatVerdictOf`, `appliedPathCountOf`, `baseResultOfTheInnerSet`, `acceptanceCheckOfTheGroup`, `groupCandidatesOfThePhase`, `hostSlots`, `holdOfTheAccount`, `tempRootOfTheRun`, `phaseDependenciesOf`, `validationQueue`, `speculationVerdictAt`, each typed and each defaulting to today's behaviour (F154-FR-020 to -067; plan "Seams added to runFeature"); done when the type compiles.
- [x] T021 In `packages/cli/src/engine/run-feature.ts` at the `parallelWiringOfTheAttempt` call (:4670-4756) pass each seam of T020 from its default reader: `failedGroupsBeforeOfTheLedger` from `countFailedGroups` (`decide.ts:1640`) for the phase, replacing `failedGroupsBefore: 0` at :4692 (F154-FR-025).
- [x] T022 Write `packages/cli/test/engine/parallel-seams-154.test.ts`: a **guard test** that with every seam at its default the wiring produces the same directives as before on `tests/fixtures/154/groups/` (F154-FR-020); done when it passes.
- [x] T023 Write `packages/runtime/src/limits/temp-root.ts`: `makeTempRoot()` (`mkdtemp` under `tmpdir()`, prefix `specstride-run-`) and `removeTempRoot(path)` that never throws (F154-FR-043); done when `packages/runtime/test/limits/temp-root.test.ts` proves a made root is removed and a dead path is ignored.
- [x] T024 In `packages/cli/src/engine/run-feature.ts` make the run's temp root through `tempRootOfTheRun` when `host.limits` is on, export it as `TMPDIR` for the gate's checks at :1273 and as `SPECSTRIDE_WORKER_TMPDIR` for workers, and remove it where the runtime root ends the run for any cause (F154-FR-043).
- [x] T025 Write `packages/cli/test/engine/temp-root-154.test.ts`: two runs on the fixture have different roots, both removed after a normal end and after a stop (F154-FR-043, F154-FR-079).
- [x] T026 Write `packages/core/src/host-limits/slot-admission.ts`: `slotAdmissionOf(observation)` over `SLOT_ADMISSION_TABLE` returning `take`, `reclaim`, `wait` or `unbounded` with the rule id, from the probe outcomes P1 to P6 of `probe.ts` (F154-FR-039, -044).
- [x] T027 Write `packages/core/test/slot-admission-154.test.ts`: proves SL-1 to SL-5, that `held-foreign` and `unknown` count as held, and that the unreadable store gives `unbounded` (F154-FR-004, -044).

**Checkpoint**: Phase 2. The wiring test, the seam guard test, the temp-root tests and `slot-admission-154.test.ts` are green.

## Phase 3: US1 — one renderer, two callers (Priority: P1) 🎯 MVP

**Goal**: the doctor and `launch --dry-run` print the same plan, bytes for bytes, with nothing else happening.
**Independent test**: on `tests/fixtures/154/plan/`, the two outputs are identical (F154-SC-002) and no slot, record or worker exists afterwards.

- [x] T028 [US1] Write `tests/parallel/154/plan-print.test.ts`: the failing test that `printThePlan` of a plan with two `[P]` runs prints the groups, every serial task with its reason, and the ceiling statement, terse by default and with the serial list behind the verbose flag (F154-FR-009, -010, -011).
- [x] T029 [US1] In `packages/layer-parallel/src/plan.ts` `printThePlan` (:543): take `{ verbose }`, print the ceiling through `expectedSavingStatement` (:656), and make the lines a pure function of the plan record (F154-FR-010, -011); done when T028 passes.
- [x] T030 [US1] Write `packages/layer-parallel/test/plan-bytes.test.ts`: 100 derivations of `planAtLaunch` on the fixture give the same plan hash and the same printed bytes (F154-SC-002).
- [x] T031 [US1] In `packages/pipeline/src/contract/launch/dry-run.ts` (:355-356) and `packages/pipeline/src/entry/dry-run.ts` (:160-162) call `printThePlan` in place of `parallelPlanLines` (:167-205), with the option off printing only behind the verbose flag, labelled `plan the option would produce`, and nothing under `parity` (F154-FR-009; CQ-154-19 A; branch under B: print only with the option on).
- [x] T032 [US1] In `packages/cli/src/engine/handlers.ts` `doctorHandler` (:580-630) print the lines of the plan observation (`packages/layer-parallel/src/doctor.ts` `planObservation:214`) through the same `printThePlan`, with the same flag rule (F154-FR-009, -010).
- [x] T033 [US1] Write `packages/cli/test/engine/plan-two-callers-154.test.ts`: on `tests/fixtures/154/plan/` the doctor's plan lines and the dry run's are the same bytes; with the option off and no flag neither prints a plan; under `parity` neither does (F154-SC-002, F154-SC-012).
- [x] T034 [US1] Correct `docs/options/parallel-units.md:36`: the doctor prints the plan with the option on, and with the option off behind the verbose flag (CQ-154-19 A); done when the page no longer says both. (F154-FR-009; CQ-154-19 A).

**Checkpoint**: Phase 3. `node packages/cli/bin/specstride doctor` and `launch --dry-run` on the fixture print the same plan; T033 and T034 are green.

## Phase 4: US1 — the report's rows and the trial (Priority: P1)

**Goal**: the report shows where the time went and what each group did; the trial is a script with a record.
**Independent test**: on the frozen events of 153 the report prints 336, 29, 274 of 386 and 28 `repair` (F154-SC-009).

- [x] T035 [US1] Write `packages/cli/test/fixtures/loop-speed/recorded-153/`: a frozen copy of feature 153's `events.jsonl` (the run under `~/.specstride/workspaces/fbc656c3ba51cb79/runs/`, ledger R-M9) with `expected.json` holding the counts of F154-SC-009; done when `report.test.ts` reads it.
- [x] T036 [US1] In `packages/cli/test/inspect/report-pr40-154.test.ts` add the case of two relaunches: the report reads every run file of the feature in time order through `select.ts` `engineEventFilesOf` (:138-158) and prints one run (F154-FR-016; PR #40); done when it passes.
- [x] T037 [US1] Write `packages/cli/test/inspect/report-pr40-154.test.ts`: a **guard test** that on `recorded-153/` the report prints the approvals, the phases approved and the approvals per attempt started (29 of 336), counting a `phase.ended` of the old vocabulary as an approval (F154-FR-013; PR #40); done when it passes.
- [x] T038 [US1] Write `packages/core/test/report-rows-154.test.ts`: the failing test that `windowSharesOf(events)` computes the four shares as a union (no time counted twice) and prints `not in the events` where no timed event holds a share (F154-FR-012).
- [x] T039 [US1] In `packages/core/src/report/rows.ts` add `windowSharesOf`, `inPassCheckTimeOutsidePasses` (the in-pass check time while no pass ran, M10) and the per-group rows (phase, outcome, applied path count, merge-check result, wall time) (F154-FR-012, -014, -015); done when T038 passes and T035's expected counts hold.
- [x] T040 [US1] In `packages/cli/src/inspect/report.ts` `reportHandler` (:113-145) print the rows of T039, terse; under `parity` print none of them (F154-FR-012, -017).
- [x] T041 [US1] Write `scripts/trial.mjs`, taking two options (the switch name and the fixture file), and run each fixture twice through the stub engine (switch off, then only that switch changed), reads both with `report`, compares the sets of exit codes, stop reasons and run states, runs the rule tests, and calls `passMarkOf` (F154-FR-018).
- [x] T042 [US1] In `scripts/trial.mjs` write the trial record (`specstride.trial/1`) to `specs/154-concurrency-and-parallelism/trials/<switch>.json` with the rows it reports without a pass mark: groups kept, refusals per reason, cost with every pass counted; and, as its first case, the engine replay of feature 153's 28 groups with the same rows for the switch on, then the recorded read of 153's events (F154-FR-018, -019).
- [x] T043 [US1] Write `packages/cli/test/inspect/trial-154.test.ts`: the trial on `tests/fixtures/154/plan/` with `loop.parallel.units` writes a record whose pass mark is stated and whose text holds no saving (F154-FR-008, -018).
- [x] T044 [US1] Run `node scripts/trial.mjs --switch loop.parallel.units --fixtures specs/154-concurrency-and-parallelism/contracts/fixtures-154.json` and read the record: it is the evidence the owner needs for the register row; it turns nothing on (CQ-154-15 A). (F154-FR-018; CQ-154-15 A).

**Checkpoint**: Phase 4. On the frozen events, `specstride report` prints the counts of F154-SC-009; `trials/loop.parallel.units.json` exists with its pass mark.

## Phase 5: US2 — every group, in plan order (Priority: P2)

**Goal**: a phase works every admissible group of its plan, each at a clean boundary, and the layer switches off after the bound of F142-FR-023.
**Independent test**: on `tests/fixtures/154/groups/`, a phase with three groups starts all three in plan order.

- [x] T045 [US2] Write `packages/cli/test/engine/parallel-groups-154.test.ts`: the failing test that a plan with three groups starts three, in order, each after `cleanPassBoundary`, and that a group left with fewer than 2 tasks after a tick is cancelled (F154-FR-020).
- [x] T046 [US2] In `packages/cli/src/engine/parallel-wiring.ts` replace `theGroupOfThePhase` (:100-102) with `theGroupsOfThePhase` returning the plan's groups; `membersOfTheGroup` (`parallel-group.ts:132-140`) loses its `groups[0]` fallback (F154-FR-020).
- [x] T047 [US2] In `packages/cli/src/engine/parallel-wiring.ts` `startIfTheBoundaryIsClean` (:529-772) loop over the groups: resume join, `cleanPassBoundary`, `groupGate`, `runTheGroupOfTheAttempt`, with `groupOrdinal` from the loop instead of `1` (:558, :667) (F154-FR-020); done when T045 passes.
- [x] T048 [US2] Write `packages/cli/test/engine/parallel-layer-off-154.test.ts`: after two failed groups of one attempt `layerOffDecision` switches the layer off and no third group starts (F142-FR-023, F154-FR-025; CQ-154-13 A).
- [x] T049 [US2] In `packages/cli/src/engine/parallel-wiring.ts` read `failedGroupsBeforeOfTheLedger` before each group and stop the loop when the count reaches the bound (F154-FR-025); done when T048 passes.
- [x] T050 [US2] Write `tests/parallel/154/completion-order.test.ts`: the property test that every permutation of worker completion on `tests/fixtures/154/groups/` leaves 0 bytes of the applied tree different (F154-SC-003).

**Checkpoint**: Phase 5. Three groups start in order on the fixture; the layer-off and completion-order tests are green; T022 still passes.

## Phase 6: US2 — `groupGate` wired: observation, halving, charge, event (Priority: P2)

**Goal**: the unreached functions of the layer have their callers, and every admission is an event.
**Independent test**: a quota window above headroom keeps a group serial with `headroom`; the admission event carries every verdict.

- [x] T051 [US2] Write `packages/cli/test/engine/parallel-quota-154.test.ts`: the failing test that with the last observed utilisation at or above `loop.parallel.quota_headroom` a group is not admitted with the check `headroom`, and with no observation it has 2 workers (F154-FR-021).
- [x] T052 [US2] In `packages/cli/src/engine/parallel-launch.ts` (:252) and before each group in `startIfTheBoundaryIsClean` feed `utilisationPerCent` from `readLimitWindow` and `headroomOf` (`packages/policy/src/quota/windows.ts:158, :318`) through `quotaObservationOf` (F154-FR-021); done when T051 passes.
- [x] T053 [US2] In `packages/cli/src/engine/parallel-wiring.ts` `startIfTheBoundaryIsClean` call `groupGate` (`admission.ts:939`) per group before its start and refuse a group whose verdict fails, with the reason recorded (F154-FR-021, -033).
- [x] T054 [US2] Write `packages/layer-parallel/test/halving-154.test.ts`: after a group ended with two transient rate limits the next group's worker count is halved (F142-FR-019, F154-FR-022).
- [x] T055 [US2] In `packages/cli/src/engine/parallel-wiring.ts`` `startIfTheBoundaryIsClean` read `workersForTheRestOfTheAttempt` (`plan.ts:202`) with `halvedAfterTransientRateLimits` (:189) before each group (F154-FR-022); done when T054 passes.
- [x] T056 [US2] In `packages/cli/src/engine/parallel-group.ts` at a worker's first start call `chargeCyclesPerAdmittedTask` (`decide.ts:1055`), and feed `cyclesSufficeForTheGroup` (:1101) into `groupGate`'s cycles check (F142-FR-021, F154-FR-023).

**Checkpoint**: Phase 6. T051, T054 and the Phase 5 tests are green; the live-record replay below still has the same counts.

## Phase 7: US2 — the admission event and the three rules of the live record (Priority: P2)

**Goal**: nothing starts again for nothing, no merge check runs on nothing, and a red base tree is not charged to a group.
**Independent test**: the engine replay of 153's phase 23 starts `g-23-1` once; 0 merge checks run after 0 applied paths.

- [x] T057 [US2] Write `packages/layer-parallel/test/admission-event-154.test.ts`: the failing test that `admissionEvent` (`decide.ts:686`) is emitted once per task and once per group with every check's verdict and detail (F154-FR-024).
- [x] T058 [US2] In `packages/cli/src/engine/parallel-wiring.ts`` `startIfTheBoundaryIsClean` emit the admission event of T057 at each admission (F142-FR-011, -025; F154-FR-024); done when T057 passes.
- [x] T059 [US2] Write `packages/layer-parallel/test/repeat-154.test.ts`: a group over the same task set that failed in an earlier attempt of the phase is refused while the fingerprint of its named paths is unchanged, and admitted once a path changed (F154-FR-026).
- [x] T060 [US2] Write `packages/layer-parallel/src/repeat.ts`: `repeatVerdictOf(group, earlierFailures, fingerprintOfNamedPaths)` over `REPEAT_TABLE` (RP-1 refuses with `repeat`, RP-2 admits) (F154-FR-026).
- [x] T061 [US2] In `packages/cli/src/engine/parallel-wiring.ts` `startIfTheBoundaryIsClean` call `repeatVerdictOf` inside `groupGate` with the ledger's failed groups of the phase and a fingerprint through the tree store's `changed` against that attempt's base (F154-FR-026); done when T059 passes.
- [x] T062 [US2] Write `packages/cli/test/engine/parallel-empty-merge-154.test.ts`: the failing test that a group whose application changed no path runs no merge check, charges no repair and is not failed (F154-FR-027, F154-SC-011).
- [x] T063 [US2] In `packages/cli/src/engine/parallel-drive.ts` `theMergeCheckOfTheGroup` (:560-574) return `not-run` when `appliedPathCountOf` is 0 (F154-FR-027); done when T062 passes.
- [x] T064 [US2] Write `packages/core/test/merge-baseline-154.test.ts`: the failing test of `baselineComparisonOf`: MG-2 on the same signature, MG-3 on a new failing command, MG-1 on an empty application (F154-FR-028).
- [x] T065 [US2] Write `packages/core/src/parallel/merge-baseline.ts`: `baselineComparisonOf(mergeCheckResult, baseResult)` over `MERGE_CHECK_OUTCOME_TABLE`, MG-2 when every failing command failed on the base result with the same failure signature (F115-FR-019), MG-3 otherwise (F154-FR-028); done when the test before it passes.
- [x] T066 [US2] In `packages/core/src/parallel/merge-check.ts` `outcomeOfTheMergeCheck` (:283) read the comparison of T063: no repair, not failed, not kept, the record `specstride.merge-baseline/1` written with its rule id; `parallel-attempt.ts` (:628-632) passes `baseResultOfTheInnerSet` (F154-FR-028; branch under CQ-154-17 B: not built).
- [x] T067 [US2] Write `packages/cli/test/engine/parallel-replay-23-154.test.ts`: the engine replay of phase 23 of 153 with its ledger: `g-23-1` starts once while its paths are unchanged (against 21 on record), and 0 merge checks run after an application of 0 paths (F154-SC-010, F154-SC-011).

**Checkpoint**: Phase 7. T057, T059, T062, T063 and T067 are green; the trial of Phase 4 re-run shows `g-23-1` once.

## Phase 8: US2 — the second worker door (Priority: P2)

**Goal**: "tested" for `concurrentSessions` means three proofs, and the dsh adapter has them.
**Independent test**: on the fake binary with N = 4, the configuration home is byte-identical (F154-SC-014).

- [ ] T068 [US2] Write `packages/adapter-dsh/test/concurrent-sessions-fake-binary.test.ts`: the failing test that four concurrent sessions of the fake binary on one configuration home leave every file of the home byte-identical (F154-FR-030, F154-SC-014).
- [ ] T069 [US2] In `packages/adapter-dsh/src/descriptor/index.ts` `dshCapabilities` (:203-275) add the `testedUnder` fact naming the three proofs: the fake-binary test, the recorded live check (CT-130-46) and the pin (`data.ts` `DSH_PIN`, `DSH_VERIFIED_ON`) (F154-FR-030); done when T068 passes and the fact reads `tested`.
- [ ] T070 [US2] Write `packages/layer-parallel/test/preconditions-154.test.ts`: the failing test that an adapter without a `testedUnder` fact is refused with `harness`, and a **guard test** that the claude path runs no group (F142-FR-020, F154-FR-029).
- [ ] T071 [US2] In `packages/layer-parallel/src/preconditions.ts` `concurrentSessionsOf` (:156-178) refuse a group when the descriptor has no `testedUnder` fact, with the reason `harness`; the claude adapter keeps `concurrentSessions` `null` (`packages/adapter-claude/src/detect.ts` :373-405) (F142-FR-020, F154-FR-029); done when the test before it passes.

**Checkpoint**: Phase 8. T068 and T068 are green; no rule names a harness (`grep -rn "dsh\|claude" packages/layer-parallel/src` finds only comments).

## Phase 9: US3 — frozen groups as the parallel unit (Priority: P3)

**Goal**: a phase's task groups are candidates, and two run at once only when a recorded rule says they are independent.
**Independent test**: two groups with disjoint scopes and `independentWith` run at once; a third with a `dependsOn` waits with `dependency`.

- [ ] T072 [US3] Write `packages/layer-parallel/test/independence-154.test.ts`: proves PG-0 to PG-3, that two task groups without a declaration are dependent, and that the later group naming a path in the earlier scope makes them dependent (F154-FR-032).
- [ ] T073 [US3] Write `packages/layer-parallel/src/groups.ts`: `plannedGroupOf(taskGroup)` mapping a frozen group (`slicer.ts` `TaskGroup:74-83`) to one `PlannedGroup` whose scope is the group's write scope (F154-FR-031).
- [ ] T074 [US3] Write `packages/layer-parallel/src/independence.ts`: `independenceOf(groupA, groupB, declaration)` over `INDEPENDENCE_TABLE`: PG-2 a declared `dependsOn` → dependent; PG-3 a declared `independentWith` → independent; PG-1 the marker rule with `scopesAreDisjoint` (`scope.ts:168`) and `pathsNamedByTheTextOfATask` (:285); PG-0 otherwise dependent (F154-FR-032).
- [ ] T075 [US3] In `packages/pipeline/src/contract/commands/derive.ts` (:606-653) and `draft/build.ts` `taskGroups` (:119-126, :332) carry an optional `dependsOn` and `independentWith` per group of `specstride.task-groups-frozen/1` (CQ-154-02, -09; branch under A: `groupCandidatesOfThePhase` returns nothing). (F154-FR-032).
- [ ] T076 [US3] In `packages/cli/src/engine/parallel-launch.ts` pass `groupCandidatesOfThePhase` (`run-feature.ts` `frozenGroupsOfThePhase:3240`) to `planAtLaunch` when `loop.parallel.groupUnits` is on, and in `startIfTheBoundaryIsClean` start the independent groups of a pair at once, the dependent ones one after the other with the check `dependency` (F154-FR-031, -032, -033).
- [ ] T077 [US3] Write `packages/cli/test/engine/parallel-group-units-154.test.ts`: on `tests/fixtures/154/groups/` two declared-independent groups are worked at once with the rule id recorded, and a `dependsOn` pair runs one after the other (F154-SC-006).

**Checkpoint**: Phase 9. T072 and T077 are green; the admission event carries `dependency` once per dependent pair.

## Phase 10: US3 — the acceptance check in the worker tree (Priority: P3)

**Goal**: the group's frozen check runs in its worker tree, run by the runtime, and can only withhold.
**Independent test**: a group whose check fails is refused with `group-check` and repaired serially; a change before the check reads `tainted`.

- [ ] T078 [US3] In `packages/cli/src/engine/micro-layer.ts` (:552-575) stop running the group check in the workspace with the fixed 300 s when `loop.parallel.groupCheck` is on; the check's declared limit is read from the frozen record (F153-FR-055; R-C19). (F154-FR-034).
- [ ] T079 [US3] Write `packages/cli/test/engine/parallel-worker-check-154.test.ts`: the failing tests that the check runs with `cwd` the worker tree and the declared limit; a failing check refuses the delta with `group-check` and charges one repair per task of the group; a tree changed before or during the check reads `tainted` and withholds; a group with no resolvable check is `unchecked` and goes on (F154-FR-034, -035, -036).
- [ ] T080 [US3] In `packages/cli/src/engine/parallel-group.ts` `closeTheGroup` (:658-736) between `:592` and `:707`: read the group's base snapshot fingerprint (`baseTreeId`), take a snapshot, run `acceptanceCheck.argv` with `runEngineCheck` (`check-run.ts:65-90`) on the worker tree, take a second snapshot, and write the worker check record bound to the three fingerprints (F154-FR-034, -035).
- [ ] T081 [US3] In `packages/cli/src/engine/parallel-drive.ts` `endRefusalOf` (:401) refuse with `group-check` when the worker check failed or is tainted (F154-FR-036).
- [ ] T082 [US3] In `packages/core/src/parallel/counters.ts` charge one repair to every task of the group for a `group-check` refusal (the exception to F143-FR-012), with no outer counter moved (F154-FR-036; CQ-154-04 A; branch under C: the check stays on the workspace, T078 to T082 are not built).
- [ ] T083 [US3] In `packages/core/src/parallel/merge-check.ts` narrow the guard `NO_CHECK_RUNS_IN_A_WORKER_TREE` (:58) to the merge check, which still never runs in a worker tree; a **guard test** in `packages/core/test/merge-check-guard.test.ts` (F142-FR-059 as amended). (F154-FR-034; F142-FR-059 as amended).
- [ ] T084 [US3] Write `packages/cli/test/engine/parallel-worker-check-leak-154.test.ts`: the worker check record never reaches the gate's manifest nor the critic's input (`grep` of the critic prompt on the fixture finds no `group-check` and no path of the worker tree) (F154-FR-006, F154-FR-069).
- [ ] T085 [US3] Write `tests/parallel/154/worker-check-property.test.ts`: for every permutation of worker completion with one failing check, only that worker's delta is withheld and the applied tree equals the serial run's (F154-SC-003, F154-SC-005).
- [ ] T086 [US3] Write the `specstride.worker-check/1` record writer in `packages/cli/src/engine/parallel-group.ts` and its reader in `packages/cli/src/inspect/report.ts` (the per-group row shows the check result); done when the report of the fixture prints `group-check` once per refused group (F154-FR-015).
- [ ] T087 [US3] Write `packages/cli/test/engine/parallel-unit-of-approval-154.test.ts`: a **guard test** that after a phase with groups as units there is exactly one approval and one commit for the phase and none for a group (F154-FR-037; CQ-153-07 A).

**Checkpoint**: Phase 10. T079, T084, T085 and T087 are green; the vocabulary test of F142-FR-066 over `tests/fixtures/154/groups/` still passes.

## Phase 11: US4 — the slot store (Priority: P4)

**Goal**: a bound shared by the runs of one host, held through files with an owner record and a liveness proof.
**Independent test**: with `host.checks.concurrent` 1 and two runs, no two full check-set executions overlap (F154-SC-007).

- [ ] T088 [US4] Write `tests/parallel/154/one-validator.test.ts`: a **guard test** that on every fixture of Phase 1 the merge checks, the full gate and the critic run one at a time on the merged tree (F154-FR-038).
- [ ] T089 [US4] Write `packages/runtime/test/limits/slot-store.test.ts`: the failing test that the store makes N lock directories per bound under `<user-state>/slots/<bound>/` through `createDirectoryLock` (`directory-lock.ts:266`), takes a free one, and names its owner with `lock/directory-lock.ts` `ownerRecordFor` (:514) (F154-FR-044).
- [ ] T090 [US4] Write `packages/runtime/src/limits/slot-store.ts`: `acquire(bound, owner)`, `probe(bound)`, `release(bound)`, each a call on the directory lock, and `slotAdmissionOf` over the probes (F154-FR-039, -044); done when T089 passes.
- [ ] T091 [US4] Write `packages/runtime/test/limits/slot-reclaim.test.ts`: a slot whose owner is dead (`stale-owner-dead`, the liveness endpoint closed) is reclaimed by one atomic rename; a live owner's slot is never removed; `held-foreign` and `unknown` count as held (F154-FR-044).
- [ ] T092 [US4] In `packages/runtime/src/limits/slot-store.ts` reclaim only on `stale-owner-dead` through `reclaimByOneAtomicRename` (`reclaim.ts`), with the tombstone (F122-FR-015, -016; F154-FR-044); done when T091 passes.
- [ ] T093 [US4] Write `packages/runtime/test/limits/slot-failure.test.ts`: a holder that dies, a clock that jumps (the lease's `validUntil` against boot id and start time), a home seen by two hosts (`held-foreign`), a full disk (the store unreadable → `unbounded`, never an error) (F154-FR-004, -044).
- [ ] T094 [US4] Write `packages/cli/test/engine/host-check-bound-154.test.ts`: the failing test that with `host.limits` on and `host.checks.concurrent` 1 two runs never overlap a full check-set execution in their events (F154-FR-039, F154-SC-007).
- [ ] T095 [US4] In `packages/cli/src/engine/run-feature.ts` at the gate (:1270) and in `parallel-drive.ts` at the merge check (:583) take a slot of the `checks` bound through `hostSlots` when `host.limits` is on, emit one `host.slot.admission` event with the verdict and rule id on `take`, `reclaim` and `wait`, and release the slot after; an unreadable store proceeds unbounded with the reason recorded (F154-FR-039, -004); done when T094 passes.
- [ ] T096 [US4] Write `packages/cli/test/engine/host-sessions-154.test.ts`: with `host.sessions.<account>` 2 and three runs, two passes are live and the third waits (F154-FR-040).
- [ ] T097 [US4] In `packages/core/src/parallel/group-executor.ts` `startWorkers` (:758) and the proposer pass start, take a slot of the `sessions` bound for the account, worker sessions included (F127-FR-033; F154-FR-040); done when T096 passes.
- [ ] T098 [US4] Write `packages/cli/test/engine/host-resources-154.test.ts`: a resource declared as `host.resources.<name>.capacity` 1 is held by one run and waited for by another (F154-FR-042).
- [ ] T099 [US4] In `packages/layer-parallel/src/register.ts` read `host.resources.*.capacity` (a positive integer) and make each a slot bound of that width (F154-FR-042); done when T098 passes.
- [ ] T100 [US4] In `packages/layer-parallel/src/register.ts` read the host bounds (`host.checks.concurrent`, `host.sessions.*`, `host.resources.*.capacity`) from user configuration, and in the config envelope let a project value only lower a host bound and never turn `host.limits` off: a raising value is refused with its reason (F154-FR-046; Principle III); done when the next task passes.
- [ ] T101 [US4] Write `packages/cli/test/engine/host-limits-narrow-154.test.ts`: project configuration that raises a host bound or turns `host.limits` off is refused, and one that lowers it is read (F154-FR-046).

**Checkpoint**: Phase 11. T091, T093, T094, T096, T098 and T101 are green; two runs on `tests/fixtures/154/slots/` never overlap a suite.

## Phase 12: US4 — the wait as a pause, the hold record (Priority: P4)

**Goal**: a wait for a slot or a hold is a pause that spends nothing; one quota hold per account.
**Independent test**: the waiting run shows `paused-quota` with the class `host_slot`, spends no budget and moves no count.

- [ ] T102 [US4] Write `packages/policy/test/quota/host-slot-class.test.ts`: `host_slot` is a member of the quota classes and `A_QUOTA_CLASS_SPENDS` says it spends nothing (CQ-154-09, -14; F154-FR-045).
- [ ] T103 [US4] In `packages/contracts/src/ep/quota-classifier.ts` add `host_slot` to the class set and to `A_QUOTA_CLASS_SPENDS` as spending nothing, behind the `host.limits` reader of T018's pattern (F154-FR-045; CQ-154-14 A); done when T102 passes.
- [ ] T104 [US4] Write `packages/cli/test/engine/host-wait-pause-154.test.ts`: the failing test that a run waiting for a slot writes the pause record with the class `host_slot`, emits `run.paused` and `run.resumed`, spends no budget, moves no count, and that paused time is excluded from the attempt's time cap (F154-FR-045, F154-SC-006).
- [ ] T105 [US4] In `packages/cli/src/engine/run-feature.ts` enter the wait through `enterPause` (`packages/policy/src/quota/pause.ts:322-397`) with the class `host_slot` and leave it through `resume` (`resume.ts:266-296`), and emit one `host.slot.admission` event with the verdict and reason (F154-FR-045, CQ-154-09); done when T104 passes.
- [ ] T106 [US4] In `packages/cli/src/status/status.ts` (:247, :258) show the pause with its class, so a slot wait reads `paused-quota (host_slot)` (F154-FR-045); a **guard test** in `packages/cli/test/status/` that a quota pause prints as before.
- [ ] T107 [US4] Write `packages/cli/test/engine/host-hold-154.test.ts`: a run that classifies a `quota_window` writes the hold; a second run of the account waits until the reset; a hold whose writer died is not reclaimed and expires at its reset only (F154-FR-041).
- [ ] T108 [US4] Write `packages/runtime/src/limits/hold-record.ts`: `writeHold(account, resetAt, owner)` and `readHold(account)` under `<user-state>/holds/<account>.json` in the shape of `host-hold.schema.json`, written atomically (F154-FR-041, -044).
- [ ] T109 [US4] In `packages/policy/src/quota/pause.ts`: `enterPause` writes the hold through the runtime root's pause writer when `host.limits` is on, and before a pass read `holdOfTheAccount` (F127-FR-010 as amended; F154-FR-041); done when T107 passes.
- [ ] T110 [US4] Write `packages/cli/test/engine/host-no-model-154.test.ts`: a **guard test** that no prompt of a waiting run asks a model whether to wait, and no model takes or releases a slot or a hold (F154-FR-005, -047).

**Checkpoint**: Phase 12. T102, T104, T107 and T110 are green; `specstride status` on `tests/fixtures/154/slots/` shows the pause with its class.

## Phase 13: US5 — the wide stage graph (Priority: P5)

**Goal**: a launch contract declares a stage group, and each stage of it runs in a workspace of its own.
**Independent test**: two independent stages run at once; a cycle, an unknown stage or a cross-group pair is refused with exit 20.

- [ ] T111 [US5] Write `packages/pipeline/test/executor/stage-admission-154.test.ts`: proves SG-1 to SG-4 over `stage-admission-table.json` (F154-FR-048, -003).
- [ ] T112 [US5] Write `packages/pipeline/src/executor/stage-admission.ts`: `admitStage(stage, declaration, groupsSoFar)` over `STAGE_ADMISSION_TABLE` (F154-FR-048); done when T111 passes.
- [ ] T113 [US5] In `packages/pipeline/src/executor/graph.ts` `declareStageGraph` (:24-29): with `pipeline.stageGroups` off one stage per group as today; on, build groups by T112 from `configuration.stageGroups` (`width`, `never_together`) and the per-stage `depends_on`; `StageGraph.mode` gains `wide`; each admitted or refused stage emits one `pipeline.stage.admission` event with its rule id (F154-FR-003, -048) (F123-FR-019 as amended; F154-FR-048).
- [ ] T114 [US5] In `packages/contracts/schemas/launch-contract.schema.json` and `packages/pipeline/src/contract/schemas/configuration.schema.json` add `configuration.stageGroups` (`width`, `never_together: [{ stages, why }]`), and in `packages/pipeline/src/contract/commands/validate.ts` `validateContract` (:62) refuse a cycle, an unknown stage or a cross-group pair with the existing exit 20 (F107 as amended; F154-FR-048).
- [ ] T115 [US5] Write `packages/pipeline/test/executor/graph-154.test.ts`: a contract with `{A, B}` width 2 gives one group of two; `never_together` gives two groups; the off switch gives the serial graph of today (F154-FR-048).
- [ ] T116 [US5] Write `packages/cli/test/contract/stage-groups-validate-154.test.ts`: the three refusals exit 20 with their reason and no run starts (F154-FR-048, F154-FR-002).

**Checkpoint**: Phase 13. T111, T115 and T116 are green; the derive of `tests/fixtures/154/stages/` accepts the declaration.

## Phase 14: US5 — a workspace per stage, and the landing (Priority: P5)

**Goal**: each stage is one run in its own workspace; a finished stage lands by rebase, gate and fast-forward, or is parked with exit 22.
**Independent test**: A lands after a green gate on the rebased tree; a conflict parks B alone (F154-SC-008).

- [ ] T117 [US5] Write `packages/pipeline/test/executor/stage-workspace-154.test.ts`: two stages have two workspaces, each with its own lock; after a landing or a park the workspace is removed; nothing lands during a stop (F154-FR-049, -079).
- [ ] T118 [US5] Write `packages/pipeline/src/executor/stage-workspace.ts`: `makeStageWorkspace(home, stage)` (a worktree of home through a port) and `removeStageWorkspace(path)`, with the record `specstride.stage-workspace/1` (`running`, `landed`, `parked`) (F154-FR-049).
- [ ] T119 [US5] In `packages/pipeline/src/executor/stage-loop.ts` (:255) run the stages of a wide group at once, each child (`child.ts` `runStageChild:106`) launched with its own workspace, lock, process tree and runtime root, coordinated only through the landing records (F154-FR-049, F123-FR-011).
- [ ] T120 [US5] In `stage-loop.ts` bound the stage runs by every host limit of G4 when `host.limits` is on: the check slot, the sessions of the account and the declared resources (F154-FR-055); done when T117 and T094 together pass on `tests/fixtures/154/stages/`.
- [ ] T121 [US5] Write `packages/core/test/landing-rule-154.test.ts`: proves LD-1 to LD-4 over `landing-table.json` (F154-FR-050).
- [ ] T122 [US5] Write `packages/core/src/landing/landing-rule.ts`: `landingDecisionOf(landingRecord, rebaseClean, gateGreen)` over `LANDING_TABLE` (F154-FR-050); done when T121 passes.
- [ ] T123 [US5] Write `packages/pipeline/test/executor/landing-154.test.ts`: on `tests/fixtures/154/stages/` A lands and B is parked with exit 22; home is unchanged by B; A's approvals stand with the note; a half-landed group resumes; 0 model calls are made for a landing (F154-SC-008, F154-FR-053).
- [ ] T124 [US5] Write `tests/parallel/154/landing-kills.test.ts`: a kill at each step of the landing (after the rebase, after the gate, after the fast-forward, before the record) leaves a state from which the next run reaches the same end (F154-FR-079).
- [ ] T125 [US5] Write `packages/pipeline/src/executor/landing-run.ts`: for the next stage in declared order: rebase onto home with the runtime's hardened git (PU-81), abort and park on a conflict, run the full gate of the stage's verification declaration through the check runner, `merge --ff-only` on green, write the record `specstride.landing/1` (F154-FR-050, -051).
- [ ] T126 [US5] In `packages/pipeline/src/executor/landing-run.ts`: park a stage on a conflict or a red gate: exit 22 for that stage, home unchanged, the other stages go on, no model called (F154-FR-052); the pipeline reaches exit 22 unchanged (codes 20 to 24 untouched).
- [ ] T127 [US5] In `packages/pipeline/src/executor/landing-run.ts`: after the fast-forward note the rewrite of every approval commit from `approvalCommitStanding` (`approval-commit.ts:67-85`), whose `rebased` case stands (PR #41); call no critic on the rebased tree (F154-FR-053, -054; CQ-154-06 A; branch under B: one critic call per landed stage).
- [ ] T128 [US5] In `packages/pipeline/src/executor/landing-run.ts`: resume a half-landed group from its landing record: a record without a fast-forward resumes at LD-1 (F154-FR-079).

**Checkpoint**: Phase 14. T117, T121, T123 and T124 are green; the vocabulary test over `tests/fixtures/154/stages/` passes.

## Phase 15: US6 — the phase dependency and the queue (Priority: P6)

**Goal**: phases declared independent are worked at once in trees of their own and validated one at a time in phase order.
**Independent test**: phases 2 and 3 declared independent are worked at once; phase 2 is gated, judged and committed first.

- [ ] T129 [US6] In `packages/contracts/src/records/generated/canonical-spec-model.ts` `SpecPhase` (:49-63) add `dependsOn?: number[]` and `writeScope?: string[]`, and regenerate `canonical-spec-model.schema.json` (F154-FR-056; CQ-154-07 A; branch under B: a declaration in the launch contract).
- [ ] T130 [US6] Write `packages/spec-formats/test/phase-dependency-154.test.ts`: the line parses, a malformed line is a parse error with its position, a phase without the line depends on none (F154-FR-056).
- [ ] T131 [US6] In `packages/spec-formats/src/adapters/speckit-tasks.ts` parse one comment line under a phase heading of `tasks.md` (`<!-- specstride: depends-on: [2] scope: packages/x/ -->`) into the fields of T129, and nothing else; a phase with no line has `dependsOn: []` (F154-FR-056; Principle IV).
- [ ] T132 [US6] In `packages/pipeline/src/contract/commands/derive.ts` carry the two fields of each phase into the launch contract's coverage, read through the canonical model (F107-FR-007; F154-FR-056); done when the derive of `tests/fixtures/154/phases/` shows the dependencies.
- [ ] T133 [US6] Write `packages/core/test/validation-queue-154.test.ts`: proves PQ-1 to PQ-3, that the head is the first ready phase in phase order, and that a rejected dependency sends the phase back to wait (F154-FR-058, -059).
- [ ] T134 [US6] Write `packages/core/src/phase-queue/validation-queue.ts`: `headOf(entries)` and `admit(entry, approvedPhases)` over `VALIDATION_QUEUE_TABLE`: PQ-1 every dependency approved → head; PQ-2 a dependency rejected → wait; PQ-3 no declaration → the phase before it (F154-FR-058, -059).
- [ ] T135 [US6] Write `packages/cli/test/engine/phase-trees-154.test.ts`: the failing test that phases 2 and 3 declared independent with disjoint scopes are worked at once in trees materialized from a snapshot, and validated one at a time (F154-FR-057, -058).
- [ ] T136 [US6] In `packages/cli/src/engine/run-feature.ts` materialize a phase tree through `materialize` (`tree-store/src/index.ts:187`) for the phases `phaseDependenciesOf` and the scopes admit, write a `specstride.phase-queue/1` entry per tree, and at the head run the existing gate, critic, approval and commit on the tree (F154-FR-057, -058); done when T135 passes.
- [ ] T137 [US6] In `packages/cli/src/engine/run-feature.ts`: at an approval advance the workspace to the phase's tree before the next phase is branched (F154-FR-058); a **guard test** that the gate runs exactly once per phase attempt on the tree the critic judges (F154-SC-005).
- [ ] T138 [US6] In `packages/cli/src/engine/run-feature.ts`: at a rejection of the head, repair it at the head and rebase a later phase that depends on it after its approval (F154-FR-059).
- [ ] T139 [US6] Write `packages/cli/test/engine/phase-queue-counters-154.test.ts`: working phases at once spends no outer counter, and each phase's attempt numbers survive a resume and a relaunch (F154-FR-060).
- [ ] T140 [US6] Write `packages/cli/test/engine/phase-trees-leak-154.test.ts`: the phase tree's path is opaque and passes the path-leak audit; the critic's input for phase 2 holds nothing of phase 3's tree (F154-FR-069).

**Checkpoint**: Phase 15. T130, T133, T135, T139 and T140 are green; one gate per phase on the fixture.

## Phase 16: US7 — work past an open verdict (Priority: P7)

**Goal**: the next phase starts in a tree of its own while the gate and the critic judge, only above the measured rate, and is set aside on a rejection.
**Independent test**: at 1 approval in 12 no speculative unit starts and `rate` is recorded; above the rate the tree integrates on approval and is discarded on rejection with no count moved.

- [ ] T141 [US7] Write `packages/core/test/speculation-154.test.ts`: proves SP-1 to SP-6; at the defaults (window 20, 50 %, depth 1) a run at 29 of 336 and one at 10 of 121 never start a unit (F154-SC-013).
- [ ] T142 [US7] Write `packages/core/src/speculation/speculation-rule.ts`: `speculationVerdictOf({ rate, depth, sweepConfirmed, verdict })` over `SPECULATION_TABLE`: SP-1 to SP-6, with the rate over the last `loop.speculate.window` attempts (F154-FR-062, -066).
- [ ] T143 [US7] In `packages/layer-parallel/src/register.ts` read `loop.speculate.depth`, `.window` and `.minRate` with the defaults 1, 20 and 50 (CQ-154-18 A; the rule is the same under any values). (F154-FR-062, -066).
- [ ] T144 [US7] Write `packages/cli/test/engine/speculation-154.test.ts`: the failing tests that at the gate of phase n a speculative tree of n+1 starts only when SP-1 holds, branched from the frozen snapshot of n's evidence, while the workspace does not change (F154-FR-061).
- [ ] T145 [US7] In `packages/cli/src/engine/run-feature.ts` at the gate's start call `speculationVerdictAt`, materialize the tree on SP-1, and emit one `loop.speculation.admission` event with `rate`, `depth` or `sweep` otherwise (F154-FR-062, -066, -067); done when T144 passes.
- [ ] T146 [US7] In `packages/core/src/parallel/before-critic.ts` apply the amended wording of F142-FR-070: a worker tree may exist when the critic has no tools (the harness's initial record, IX) or the read denial of the worker root is confirmed by the sweep; under CQ-154-08 B no speculative unit starts before the critic returns (F154-FR-067, -075).
- [ ] T147 [US7] In `packages/cli/src/engine/run-feature.ts`: on an approval integrate the speculative tree through `integrateGroup` (`integrate.ts:288`) before phase n+1's own gate; on a rejection discard it, write the `specstride.set-aside/1` record with its cost, and move no counter (F154-FR-063, -064, -065: the grain is the phase).
- [ ] T148 [US7] In `packages/core/src/report/rows.ts` add the speculation rows (units started, integrated, set aside, the cost of those set aside) and print them in `report.ts` (F154-FR-015, -064).
- [ ] T149 [US7] Write `packages/cli/test/engine/speculation-isolation-154.test.ts`: 0 critic-class calls start while a speculative tree exists outside a confirmed read denial; the prompt of the speculative unit carries no word of the open verdict; a stop ends the speculative worker as it ends a group worker (F154-SC-004, F154-FR-074, -080).
- [ ] T150 [US7] Write `tests/parallel/154/speculation-cost.test.ts`: on the fixture with a stub critic that rejects, the set-aside record holds the tokens, wall time and cycles, no attempt kind or stop reason is recorded, and the report prints the cost (F154-FR-064, -002).

**Checkpoint**: Phase 16. T141, T144, T149 and T150 are green; with the switch on at the measured rates nothing starts.

## Phase 17: G8 — the red team's channels (cross-cutting)

**Goal**: every channel of R29v that a new behaviour re-opens or widens has its test on this feature's fixtures.
**Checkpoint**: the tests of T151 to T163 are green over `tests/fixtures/154/`.

- [ ] T151 [G8] Write `tests/parallel/154/vocabulary-154.test.ts`: the vocabulary test of F142-FR-066 over every fixture with every switch on, against the serial run as baseline: 0 new words in any critic prompt (V-01; F154-FR-068).
- [ ] T152 [G8] Write `tests/parallel/154/path-leak-154.test.ts`: the path-leak audit of F142-FR-056 over a phase tree and a speculative tree: 0 hits (V-02, V-09; F154-FR-069).
- [ ] T153 [G8] Write `tests/parallel/154/checks-at-once-154.test.ts`: N acceptance checks at once follow F148-FR-011 to -017, and a speculative unit's checks share no temporary directory, port or exclusive resource with the gate (V-04; F154-FR-070).
- [ ] T154 [G8] Write `tests/parallel/154/hardened-git-154.test.ts`: the landing rebase runs with no system or global configuration, no hooks and no filters (PU-81; F154-FR-071).
- [ ] T155 [G8] Write `tests/parallel/154/scratch-154.test.ts`: every temporary file of a run, a worker and a stage sits under the run's temporary root or the stage workspace; 0 files elsewhere after the run (V-08; F154-FR-072, -043).
- [ ] T156 [G8] Write `tests/parallel/154/ticks-154.test.ts`: ticks of a later phase are written only at its approval, and a set-aside unit writes none (V-11; F154-FR-073).
- [ ] T157 [G8] Write `tests/parallel/154/stop-154.test.ts`: a stop in the middle of a wide stage group, a phase queue or a speculative unit leaves each to its resume state and lands nothing (V-12, V-19; F154-FR-074, -079).
- [ ] T158 [G8] Write `tests/parallel/154/caps-154.test.ts`: the attempt time cap and the hard ceilings count every worker of every group of the attempt, and across runs the per-account bound holds (V-15, V-17; F154-FR-076).
- [ ] T159 [G8] Write `tests/parallel/154/no-cycle-for-a-wait-154.test.ts`: a wait for a slot charges no cycle and the `[LOOP]` line gains no field (V-16; F154-FR-077).
- [ ] T160 [G8] Write `tests/parallel/154/harness-error-154.test.ts`: a harness error in any worker of any group, including a group-check worker, switches the layer off for the phase attempt (V-18; F154-FR-078).
- [ ] T161 [G8] Write `tests/parallel/154/breach-invariants-154.test.ts`: the five breach invariants of F142-FR-071 hold over every fixture with every switch on (F154-FR-018 TRI-1).
- [ ] T162 [G8] In `docs/options/parallel-units.md` §4 state that the two channels stay "narrowed and not closed" for groups as units, phases side by side and speculation (F154-FR-081).
- [ ] T163 [G8] Write `tests/inertness/154/closed-sets-154.test.ts`: over every fixture with every switch on, the sets of exit codes, stop reasons and run states are subsets of those with them off (F154-SC-001, F154-FR-002).

## Phase 18: Polish — fixtures, trials, register rows

**Goal**: each switch has a trial record read by a person, and the register rows are ready for the owner.
**Checkpoint**: `specs/154-concurrency-and-parallelism/trials/` holds one record per switch.

- [ ] T164 [G0] Write `tests/inertness/154/governance-holds.test.ts`: with every switch on, one critic per phase in a fresh session, a nonce-bound verdict, a signed approval and one commit per approved phase (F154-FR-006).
- [ ] T165 [G0] Write `tests/inertness/154/no-model-locks.test.ts`: a **guard test** over every fixture that no model took or released a lock, a slot or a hold, merged content or judged independence (F154-FR-005).
- [ ] T166 [G0] Write `tests/inertness/154/degrade-to-serial.test.ts`: a broken slot store, an unreadable dependency line and a failed landing each fall back to serial with the reason recorded and no error that stops the run (F154-FR-004, -002).
- [ ] T167 [G0] Write `tests/inertness/154/no-saving.test.ts`: a **guard test** that no printed line of the plan, the report or the trial record holds a forecast (the words "speed-up", "faster", "saving" outside the ceiling statement) (F154-FR-008).
- [ ] T168 [G0] In `docs/ecosystem/consolidation.md` §6 do NOT write a row: add one line under "Drift" that `register-map.json` runs to DV-122 and the register to DV-120, so the owner reconciles before assigning ids (row 25 of `closed-set-deltas.md`). (F154-FR-081).
- [ ] T169 [G0] Run the trial script `scripts/trial.mjs` once per switch for each of the eight new switches, with the fixture file `specs/154-concurrency-and-parallelism/contracts/fixtures-154.json` (its two options take one switch name and one file path; the loop is written by the task, never a placeholder on a command line); each writes its record under `trials/`; the records are read by the owner before any register row turns a switch on (F154-FR-001, -018; CQ-154-15 A).
- [ ] T170 [G0] Write `specs/154-concurrency-and-parallelism/verified.md` from the trial records: per switch, its pass mark, its rows, and "off until ruled" (the house form of spec 153's `verified.md`). (F154-SC-001, F154-FR-002).
- [ ] T171 [G0] Re-run `speckit-analyze` over spec.md, plan.md and this file; resolve every finding; append a dated section to `specs/154-concurrency-and-parallelism/analyze-report.md`, keeping the 27 resolved findings of the first run (the task-coverage pass the report of 2026-11-25 could not make). (F154-FR-003).
- [ ] T172 [G0] Write `packages/cli/test/engine/quickstart-154.test.ts`: one test per section of quickstart.md, so the quickstart cannot drift from the code (the eight scenarios it names). (quickstart.md; F154-SC-001 to -014).

**Checkpoint**: Phase 18. One trial record per switch; `verified.md` written; analyze over the three artefacts reports 0 critical and 0 high.

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (data) before every other phase; Phase 2 (seams) before 5 to 16.
- Phase 3 and 4 (US1) need only 1 and 2: the MVP is Phases 1 to 4.
- Phase 5 then 6 then 7 then 8 (US2, in order: the loop, the gate, the rules, the door).
- Phase 9 then 10 (US3) need 7.
- Phase 11 then 12 (US4) need only 2; they can run beside 5 to 10.
- Phase 13 then 14 (US5) need 11 (the check slot) and the gate of the engine.
- Phase 15 (US6) needs 14 (the rebase of the landing) and 7; Phase 16 (US7) needs 15 and 10.
- Phase 17 (G8) lands with its slice; its tests are written last and must pass.
- Phase 18 last.

### Ruling gates

Every ruling is answered (spec.md "Clarifications"). A task whose branch under the other answer
is named is built for the recommended answer; an overturned ruling changes that task alone.

### Within each phase

ID order is execution order. A test task precedes the task that makes it pass. The shared files
`run-feature.ts`, `parallel-wiring.ts`, `parallel-group.ts`, `parallel-drive.ts` and `stage-loop.ts`
are changed by one pass at a time.

## Parallel Examples

```text
# No [P] markers: the engine's shared files are changed in order by one pass.
# Core-only phases (1, and the pure tables of 7, 11, 14, 15, 16) can run beside an engine phase.
```

## Implementation Strategy

1. **MVP**: Phases 1 to 4. The loop measures what could run side by side: the plan, the report, the trial.
2. **Then the layer in full**: Phases 5 to 8. Every group of a phase lands; the three rules of the live record stop the waste of 153.
3. **Then groups as units**: Phases 9 and 10.
4. **Then shared limits**: Phases 11 and 12.
5. **Then stages side by side**: Phases 13 and 14. **Then phases side by side**: Phase 15. **Then work past an open verdict**: Phase 16 — built last, off at every measured rate.
6. **Then the channels**: Phase 17, and **Polish**: Phase 18.

Each phase is at most 20 tasks and ends at a checkpoint: run this feature through the engine one
phase at a time, and stop to check at each checkpoint.
