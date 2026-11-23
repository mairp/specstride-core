---

description: "Task list of feature 123-pipeline-runtime-and-supervisor"
---

# Tasks: Pipeline runtime and supervisor

**Input**: Design documents from `specs/123-pipeline-runtime-and-supervisor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Requested for every feature (constitution, Development Workflow). Parity tests and characterization tests are required tasks. A parity test names what it proves (`proves:`) and its fixture (`fixture:`), as `STAGE-B-RULES.md` section 4 says.

**Organization**: Tasks are grouped by user story. The stage executor that every story stands on is in Phase 2. Stage B writes no product code: these tasks are for the implementation stage.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on an unfinished task)
- **[Story]**: US1 a run looks after itself; US2 supervision is cheap and every refusal is named; US3 parity under the `parity` profile; US4 a stage kind without touching the core; US5 the dry-run plan

## Path Conventions

`packages/pipeline/` (library, layer L5), `packages/cli/src/commands/supervise.ts` (verb wiring), `tests/parity/123/` (parity tests) and `tests/characterization/123/` (characterization tests), both at the root of the repository as feature 100 places them (`specs/100-specstride/plan.md`, "Project Structure"), `packages/testkit/src/conformance/EP-19/` and `packages/testkit/src/samples/EP-19/` (conformance suite and sample of EP-19). The fixture families FX-35 and FX-36 of feature 141 run in two variants: `@engine-stub` and `@full-stack`.

Spikes, fixture captures, live probes and experiments: this feature inherits none. The spike of feature 122 (detach survival inside a host session) bears on `launch`; its result is consumed, not repeated here. No paid probe is planned: no task of this list calls a model.

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create the package skeleton `packages/pipeline/` (`package.json` for `@specstride/pipeline`, `tsconfig.json` strict, `src/{entry,executor,kinds,checks,output,launch-checks,relaunch,supervisor}/`, `data/`, `test/`), with the imports the package graph allows and no others
- [x] T002 [P] Add the test frame: `tests/characterization/123/support/clock.ts` (fake `now()` and `sleep()`), `tests/characterization/123/support/run.ts` (start the pipeline entry against the engine stub of feature 141), and the directory `tests/parity/123/`
- [x] T003 [P] Add the step "contracts of feature 123" to the specification job of CI: `python3 specs/123-pipeline-runtime-and-supervisor/contracts/tools/generate.py --check`
- [x] T004 Confirm with the catalogue of feature 141 that the engine stub and the scenarios of FX-35 and FX-36 exist. List the scenarios this feature adds inside the scope of those families (F141-FR-030): `stale-sources`, `invalid-launch-contract`, `colour-always`, `colour-never`, `setup-without-implement`, `precondition-fails`, `relaunch-budget-<n>`, `observe-cadence`, `gate-<refusal>`, which has 10 members, one for each launch-check refusal except `already-running`, and `gate-attach` for that eleventh refusal (feature 141, §O.2, "Members of the pattern names"). The follow-up of feature 141 added the six scenarios of FX-35 and `observe-cadence` to its catalogue and assigned the pattern `relaunch-budget-<n>` to this feature. Record the list in `tests/parity/123/scenarios.md`

**Checkpoint**: the package builds, the test frame runs a fake-clock test, the scenario list is agreed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the data files, the line table and the pipeline entry with its stage executor. Every user story needs them.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Needed from Phase 6**: validation (T010), preflight (T012) and the stage loop (T013) reach stage kinds and precondition checks through the registries only (F123-FR-010). The tasks T072 (test first), T073 and T074 are therefore done inside this phase, before T010; they keep their ids and their place in Phase 6.

- [x] T005 Copy the data of `contracts/` into `packages/pipeline/data/` (`relaunch-observe.table.json`, `relaunch-root.table.json`, `lines.json` from `pipeline-lines.json` and `supervise-verbs.json`, and `stage-kinds.json`, which `contracts/` does not hold and this task writes from the lists `stageKinds` and `preconditionChecks` of `closed-sets.json`) and validate each against its schema at load in `packages/pipeline/src/output/load-data.ts`: the two tables against `contracts/schemas/relaunch-table.schema.json`, and `lines.json` and `stage-kinds.json` against schemas that this task adds in `packages/pipeline/data/schemas/`, because `contracts/schemas/` holds the schema of a classifier table only
- [x] T006 [P] Register the closed sets that this feature owns with the `contracts` package (the rows of annex X §X.6 that name 123, among them row 101 for the refusals of `resolve`, and the set "Hold refusals" (`no-live-run`), proposed as row 279 in `analyze-report.md`, "Proposed upstream fixes") in `packages/contracts/src/closed-sets/pipeline.ts`, so that the static test of F100-FR-209 finds a branch for every unknown value
- [x] T007 [P] Implement the line table reader, the colour decision and the hues, the redacted action, and the two output modes in `packages/pipeline/src/output/lines.ts` (F123-FR-002, F123-FR-017)
- [x] T008 [P] Implement the pipeline state record with atomic writes, sorted keys, indent 2, whole-second times, and unreadable content read as empty in `packages/pipeline/src/executor/state-record.ts` (F123-FR-007, F123-FR-009)
- [x] T009 [P] Implement the child environment builder (copy of named variables, the messages for a missing variable, the pinned keys, `NO_COLOR`, no live output) in `packages/pipeline/src/executor/child-env.ts` (F123-FR-003)
- [x] T010 Implement the arguments and the start-up order (arguments, load and validate, `[WARN]`, stale then invalid, dry run, lock) in `packages/pipeline/src/entry/start.ts`, and the dry-run plan of §R.2 (`[DRY-RUN]`, `[PREFLIGHT]` with `deferred` for `command_success`, `[SKIP]`, `[CHECK]`, `[PLAN]`, exactly one digest, no action and no write) in `packages/pipeline/src/entry/dry-run.ts` (F123-FR-001, F123-FR-004, F123-FR-005)
- [x] T011 Implement the lock at start and the exit 24 with its two lines in `packages/pipeline/src/entry/lock.ts`, through the lock provider of EP-13 (F123-FR-007)
- [x] T012 Implement preflight, collecting every failure, in `packages/pipeline/src/executor/preflight.ts` (F123-FR-008)
- [x] T013 Implement the stage loop: order, smoke skip, skip of a completed stage, reset on a changed launch contract hash, the state values and the digest of a complete run in `packages/pipeline/src/executor/stage-loop.ts` (F123-FR-009)
- [x] T014 Implement the stage child runner: argument array, no shell, own process session, standard input closed, timeout with the kill after 5 seconds, child codes 124 and 127, terminal or pipe or inherited streams, and the log of a `specstride` stage in `packages/pipeline/src/executor/child.ts` (F123-FR-011)
- [x] T015 Implement in-stage retry (attempts, resume action, backoff, deadline, reason rule, `[RECOVER]`, `[FAIL]`, `[PASS]`, `[ERROR]`) in `packages/pipeline/src/executor/retry.ts` (F123-FR-012)
- [x] T016 Implement the exit codes, the final state and the signal handling in `packages/pipeline/src/executor/exit.ts` (F123-FR-013, F123-FR-014)
- [x] T017 Implement the read of the terminal record, the crash fallback with a synthesized record, the reason rule, and the printed `stop-reason=` of the compatibility projection in `packages/pipeline/src/executor/outcome.ts` (F123-FR-015)
- [x] T018 Implement the digest from events and the compatibility lines in `packages/pipeline/src/output/digest.ts` (F123-FR-016)
- [x] T019 [P] Emit the events `stage.started`, `stage.ended`, the `supervisor.*` events, `pipeline.started` and `pipeline.ended` (one pair per launch and per relaunch), `digest.written` (once, with the digest) and `launch.checked` (for the checks that the root verifies itself) through the event port in `packages/pipeline/src/executor/events.ts`; a dry run and the two start-up refusals write no event; declare the stage graph serial with groups of one stage in `packages/pipeline/src/executor/graph.ts` (F123-FR-018, F123-FR-019)
- [x] T020 Implement the run request of kind `engine` (one stage of kind `specstride` that declares no recovery; budget 2, no deadline of its own) in `packages/pipeline/src/entry/engine-request.ts` (F123-FR-020)

**Checkpoint**: the pipeline entry runs a launch contract with the engine stub and prints the lines of §R.2

---

## Phase 3: User Story 1 - A run looks after itself (Priority: P1) 🎯 MVP

**Goal**: with `relaunch.owner: root` the runtime root relaunches a transient stop and a crash within budget, with no host process, and never relaunches what it must not. The tests T082 and T083 of Phase 8 prove the same for `relaunch.owner: supervise`.

**Independent Test**: with the engine stub and no `supervise` verb, an engine that ends `wall_budget` with `retryable: true` twice and then succeeds gives exit 0 after two relaunches; a crash gives `classified-crash`; a `hold` stops the relaunch.

### Tests for User Story 1

- [x] T021 [P] [US1] Characterization test CT-123-129: golden decision per row of table 2, and the property that every vector of the finite domains of the signals gives exactly one row, in `tests/characterization/123/relaunch-root-table.test.ts` (measures F123-SC-008)
  - proves: F123-FR-029
- [x] T022 [P] [US1] Characterization test CT-123-130: a run in `blocked-on-human`, a run stopped on request, a signal, a non-retryable stop, a quota pause and a stop for a changed source are relaunched 0 times under table 2, and a stop by a tripped wall-clock budget (`retryable: true`, no blocked reason) is relaunched; the pipeline ends 22 with the state `failed` and the digest carries the child exit, in `tests/characterization/123/never-relaunched.test.ts` (measures F123-SC-010)
  - proves: F123-FR-030
- [x] T023 [P] [US1] Characterization test CT-123-133: a crashed engine and a transient stop are relaunched within budget with counts and ids carried from the ledger, a fresh session, preflight again, a new launch id, and the events `supervisor.observed` and `supervisor.relaunch` in `tests/characterization/123/root-relaunch.test.ts` (measures F123-SC-001)
  - proves: F123-FR-033
- [x] T024 [P] [US1] Characterization test CT-123-132: `hold-relaunch` holds, `release` lifts it, a hold past the deadline ends the run `failed` with `budget-deadline-exceeded` and the detail of the decision says that the relaunch was held, and under `supervise` the request has no effect and the verbs `hold` and `release` refuse with `no-live-run` and exit 4, in `tests/characterization/123/hold-relaunch.test.ts`
  - proves: F123-FR-032
- [x] T025 [P] [US1] Characterization test CT-123-127: `relaunch.owner` values, default, unknown value, and the value recorded for the whole run in `tests/characterization/123/relaunch-owner.test.ts`
  - proves: F123-FR-027
- [x] T026 [P] [US1] Characterization test: the budget default 2, the declared 0 to 5, the ceiling, the deadline fixed at the first launch, one budget per launch, and no run relaunched more than 5 times, in `tests/characterization/123/relaunch-budget.test.ts` (measures F123-SC-007)
  - proves: F123-FR-031

### Implementation for User Story 1

- [x] T027 [P] [US1] Implement the signal builders and the evaluation of table 2 through the kernel's table evaluator, recording the rule id and the table version, in `packages/pipeline/src/relaunch/root-table.ts` (F123-FR-029)
- [x] T028 [P] [US1] Implement the relaunch budget (declared seconds, default, ceiling, deadline, remaining, source) in `packages/pipeline/src/relaunch/budget.ts` (F123-FR-031)
- [x] T029 [US1] Implement the relaunch procedure of the root: end owned processes, backoff, new launch id and engine start, fresh session, re-enter preflight and the stage loop, state `relaunching` in `packages/pipeline/src/relaunch/root-relaunch.ts` (F123-FR-033)
- [x] T030 [US1] Implement the read of `inbox:hold-relaunch`, the wait in `relaunching`, and the end at the deadline in `packages/pipeline/src/relaunch/hold.ts` (F123-FR-032)
- [x] T031 [US1] Implement the `relaunch.owner` switch: with `root` the root stays alive and consults table 2; with `supervise` it exits with the pipeline code, in `packages/pipeline/src/relaunch/owner.ts` (F123-FR-027, F123-FR-030)
- [x] T032 [US1] Write the run-state transitions that belong to the root (T4, T5, T10, T11, T12, T14, T15, T16, and its part of T8 and T9) in `packages/pipeline/src/relaunch/transitions.ts` (F123-FR-013)

**Checkpoint**: a run relaunches itself with no host; the never-relaunched cases hold

---

## Phase 4: User Story 2 - Supervision is cheap and every refusal is named (Priority: P1)

**Goal**: the launch checks, `supervise` and its verbs, the cadence, the exit map, the lines of both modes, and the byte limits.

**Independent Test**: a fixture per refusal literal prints the literal and the exit code in both modes; a 24-hour run on a fake clock prints at most 8,400 bytes in default output.

### Tests for User Story 2

- [x] T033 [P] [US2] Characterization test CT-123-122: the six launch checks are registered with the launch-blocking flag and a fixed order; another registered check runs after them; under `parity` only the six print; a held workspace lock gives `attach` in `tests/characterization/123/launch-check-registry.test.ts`
  - proves: F123-FR-022
- [x] T034 [P] [US2] Characterization test CT-123-134: the verbs of §R.7 with their arguments, `--launcher` and `--run-dir` exclusive, `gate`, `launch` and `auto` only with `--launcher`, `stop` records the request before it signals and sends no kill signal, and the cadence: 60, 1.5, 600, reset on a change, persisted between wake-ups, expiry with exit 5, on a fake clock in `tests/characterization/123/supervise-verbs.test.ts` (measures F123-SC-006)
  - proves: F123-FR-034; F123-FR-035; F123-FR-036; F123-FR-037
- [x] T035 [P] [US2] Characterization test CT-123-124: the three handshake outcomes and their exit codes for `launch` and `supervise launch` in `tests/characterization/123/handshake-exits.test.ts`
  - proves: F123-FR-024
- [x] T036 [P] [US2] Characterization test CT-123-141: the byte limits of default output on a simulated 24-hour run with `relaunch.owner: root` (420, 0, 700, 8,400) in `tests/characterization/123/output-budget.test.ts` (measures F123-SC-002)
  - proves: F123-FR-041
- [x] T037 [P] [US2] Characterization test CT-123-139: default output prints the table "Default output" of §R.8, nothing for an unchanged reading, no text of a run, in `tests/characterization/123/default-output.test.ts`
  - proves: F123-FR-039; F123-FR-017
- [x] T038 [P] [US2] Characterization test CT-123-140: with `relaunch.owner: root` the verbs `watch`, `observe` and `auto` read and print and never relaunch; the relaunch count comes from the events of the root in `tests/characterization/123/supervise-under-root.test.ts`
  - proves: F123-FR-040
- [x] T039 [P] [US2] Characterization test: one fixture per refusal literal (the 11 of the launch checks, the members of both relaunch refusal tables, the five of `resolve`) prints its literal in compatibility output and in default output with the exit code of its row, in `tests/characterization/123/refusal-literals.test.ts` (measures F123-SC-003)
  - proves: F123-FR-021; F123-FR-026; F123-FR-028

### Implementation for User Story 2

- [x] T040 [P] [US2] Implement the six launch checks and the decision, with the details of each refusal, in `packages/pipeline/src/launch-checks/checks.ts`, and register them as launch-blocking checks of the doctor registry in `packages/pipeline/src/launch-checks/register.ts` (F123-FR-021, F123-FR-022)
- [x] T041 [US2] Implement `supervise launch` (argument array, detach strategy port, launch log headers, the record of §R.9, the launch line, the handshake exit codes) in `packages/pipeline/src/supervisor/launch.ts` and `packages/cli/src/commands/supervise.ts` (F123-FR-023, F123-FR-024)
- [x] T042 [P] [US2] Implement `supervise mode` (tokens, refusal, auto and run phrases, flags, the mode map, the default `run`) in `packages/pipeline/src/supervisor/mode.ts` (F123-FR-025)
- [x] T043 [P] [US2] Implement `supervise resolve` (resolution order, generated marker, the five refusals) in `packages/pipeline/src/supervisor/resolve.ts` (F123-FR-026)
- [x] T044 [P] [US2] Implement the observation (authority order, status derivation, signature, detail, elapsed clamping) in `packages/pipeline/src/supervisor/observe.ts` (F123-FR-036)
- [x] T045 [P] [US2] Implement the cadence (60, 1.5, 600, reset on a change or `RECOVER`, persisted state, expiry) in `packages/pipeline/src/supervisor/cadence.ts` (F123-FR-035)
- [x] T046 [US2] Implement the verbs `gate`, `watch`, `observe`, `auto`, `stop`, `hold`, `release`, their arguments and results, and the exit map, in `packages/pipeline/src/supervisor/verbs.ts` and `packages/cli/src/commands/supervise.ts` (F123-FR-034, F123-FR-037)
- [x] T047 [P] [US2] Implement the supervision record, written by the CLI only and through the atomic write of the kernel (Principle I), in `packages/pipeline/src/supervisor/record.ts` (F123-FR-040)
- [x] T048 [P] [US2] Implement the supervisor lines of both modes from the line table, the report log, and the next-action texts in `packages/pipeline/src/supervisor/lines.ts` (F123-FR-038, F123-FR-039)
- [x] T049 [P] [US2] Implement table 1 and the relaunch by `supervise observe` (recorded argument list, current environment, budget decrement, justification) in `packages/pipeline/src/relaunch/observe-table.ts` (F123-FR-028)

**Checkpoint**: every refusal is named; supervision output stays inside its limits

---

## Phase 5: User Story 3 - The port behaves as the baseline under the `parity` profile (Priority: P1)

**Goal**: FX-35 and FX-36 give `equal` or `waived (DV-075, DV-009)` in both variants.

**Independent Test**: run the parity tests below under the profile `parity`.

### Parity tests for User Story 3

Each test runs its scenarios twice, `@engine-stub` and `@full-stack` (F141-FR-016).

- [x] T050 [P] [US3] Parity test PT-123-011FR011-start-refusals, with PT-123-C-227-start-refusals, in `tests/parity/123/start-refusals.test.ts`
  - proves: 011 FR-011; C-227
  - fixture: FX-35/dry-run, FX-35/stale-sources, FX-35/invalid-launch-contract
- [x] T051 [P] [US3] Parity test PT-123-011SC003-dry-run, with PT-123-C-225-arguments-and-dry-run, in `tests/parity/123/dry-run.test.ts`
  - proves: 011 SC-003; C-225
  - fixture: FX-35/dry-run
- [x] T052 [P] [US3] Parity test PT-123-011FR012-lock-and-state, with PT-123-C-229-lock-and-state, in `tests/parity/123/lock-and-state.test.ts`
  - proves: 011 FR-012; C-229
  - fixture: FX-35/lock-held, FX-35/second-pipeline-on-held-workspace (waiver DV-075)
- [x] T053 [P] [US3] Parity test PT-123-011FR013-preflight in `tests/parity/123/preflight.test.ts`
  - proves: 011 FR-013
  - fixture: FX-35/preflight-fails
- [x] T054 [P] [US3] Parity test PT-123-011FR014-stages-and-resume in `tests/parity/123/stages.test.ts`
  - proves: 011 FR-014
  - fixture: FX-35/stages-complete, FX-35/pipeline-resume
- [x] T055 [P] [US3] Parity test PT-123-011FR015-retry-and-signals in `tests/parity/123/retry.test.ts`
  - proves: 011 FR-015
  - fixture: FX-35/stage-fails, FX-35/stage-timeout, FX-35/in-stage-retry, FX-35/signal-<name>
- [x] T056 [P] [US3] Parity test PT-123-011FR019-launch-checks, with PT-123-C-252-launch-checks, in `tests/parity/123/launch-checks.test.ts`
  - proves: 011 FR-019; C-252
  - fixture: FX-36/gate-<refusal> (10 members), FX-36/gate-attach
- [x] T057 [P] [US3] Parity test PT-123-011FR020-launch, with PT-123-C-253-launch, in `tests/parity/123/launch.test.ts`
  - proves: 011 FR-020; C-253
  - fixture: FX-36/launch
- [x] T058 [P] [US3] Parity test PT-123-011FR021-relaunch-classifier in `tests/parity/123/relaunch-classifier.test.ts`
  - proves: 011 FR-021
  - fixture: FX-36/relaunch-<decision>
- [x] T059 [P] [US3] Parity test PT-123-011FR022-relaunch-budget, with PT-123-011SC006-relaunch-budget and PT-123-C-218-relaunch-budget, in `tests/parity/123/relaunch-budget.test.ts`
  - proves: 011 FR-022; 011 SC-006; C-218
  - fixture: FX-36/relaunch-budget-<n>
- [x] T060 [P] [US3] Parity test PT-123-011FR023-lines-and-digest, with PT-123-C-230-lines-and-digest, PT-123-C-254-supervisor-lines and PT-123-C-249-stop-line, in `tests/parity/123/lines.test.ts`
  - proves: 011 FR-023; C-230; C-254; C-249
  - fixture: FX-35/dry-run, FX-35/stage-fails, FX-36/observe-<status>, FX-36/launch
- [x] T061 [P] [US3] Parity test PT-123-011SC005-poll-cadence, with PT-123-C-247-poll-cadence, in `tests/parity/123/cadence.test.ts`
  - proves: 011 SC-005; C-247
  - fixture: FX-36/observe-cadence
- [x] T062 [P] [US3] Parity test PT-123-C-215-retryable-reasons in `tests/parity/123/retryable-reasons.test.ts`
  - proves: C-215
  - fixture: FX-35/in-stage-retry, FX-36/relaunch-<decision>
- [x] T063 [P] [US3] Parity test PT-123-C-226-colour-and-env in `tests/parity/123/colour-env.test.ts`
  - proves: C-226; C-250
  - fixture: FX-35/colour-always, FX-35/colour-never, FX-36/launch
- [x] T064 [P] [US3] Parity test PT-123-C-228-stage-reasons in `tests/parity/123/stage-reasons.test.ts`
  - proves: C-228
  - fixture: FX-35/stage-fails, FX-35/stage-timeout, FX-35/setup-without-implement, FX-35/precondition-fails
- [x] T065 [P] [US3] Parity test PT-123-C-231-runtime-behaviour in `tests/parity/123/runtime-behaviour.test.ts`
  - proves: C-231
  - fixture: FX-35/stages-complete, FX-35/in-stage-retry, FX-35/pipeline-resume, FX-35/colour-never
- [x] T066 [P] [US3] Parity test PT-123-C-246-supervise-verbs, with PT-123-C-248-exit-map and PT-123-C-251-refusal-line, in `tests/parity/123/supervise-verbs.test.ts`
  - proves: C-246; C-248; C-251
  - fixture: FX-36/mode-<case>, FX-36/mode-no-execution-phrasing (waiver DV-009), FX-36/launch, FX-36/observe-<status>, FX-36/stop
- [x] T067 [P] [US3] Parity test PT-123-C-255-supervisor-behaviour in `tests/parity/123/supervisor-behaviour.test.ts`
  - proves: C-255
  - fixture: FX-36/mode-<case>, FX-36/gate-<refusal>, FX-36/observe-<status>, FX-36/relaunch-<decision>, FX-36/stop
- [x] T068 [US3] Build the members of the pattern `relaunch-budget-<n>`, which the catalogue of feature 141 assigns to this feature, and confirm that the other scenarios of T004 are in the catalogue (they are, since the follow-up of feature 141). Add them as data, using only its stub verbs and surfaces, in `packages/oracle/fixtures/FX-35/` and `packages/oracle/fixtures/FX-36/` (F141-FR-030); file the request with the owner of the oracle before the tests T050 to T067 can run

### Implementation for User Story 3

- [x] T069 [US3] Characterization test CT-123-117, which drives the profile `parity`: assert that with `relaunch.owner: supervise`, `output.compat` and no new line the pipeline entry exits 22 at a failed stage and the root does not stay alive, in `tests/characterization/123/parity-profile.test.ts`
  - proves: F123-FR-013; F123-FR-017
- [x] T070 [US3] Wire the `@engine-stub` and `@full-stack` variants of FX-35 and FX-36 into the parity job for macOS as well; every macOS result stays `unverified` until the runner passes, in `.github/workflows/parity-123.yml`
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.

**Checkpoint**: 0 results `different` on FX-35 and FX-36 in both variants

---

## Phase 6: User Story 4 - An author adds a stage kind without touching the core (Priority: P2)

**Goal**: EP-19 registries, the built-in entries, the sample and the conformance suite.

**Independent Test**: register the sample kind and the sample check from the test tree; validate, plan and run; remove them; no core file differs.

- [x] T071 [P] [US4] Conformance test CT-123-110 for EP-19 in `packages/testkit/src/conformance/EP-19/stage-kind.ts`: `validate`, `run` and `evaluate` of a sample kind and a sample check registered from `packages/testkit/src/samples/EP-19/`, shown by the dry run and executed, with no change to the schema of the launch contract or to the stage executor; the import-boundary check fails when a core file names the sample (measures F123-SC-009)
  - proves: F123-FR-010
- [x] T072 [P] [US4] Characterization test: an unknown kind and an unknown check make the launch contract invalid (exit 20); a kind that throws ends the stage with `exec-error:`; a check that throws is `fail`; a check never writes, in `tests/characterization/123/registry-failures.test.ts`
  - proves: F123-FR-010
- [x] T073 [US4] Implement the two registries, the five built-in kinds and the six built-in checks in `packages/pipeline/src/kinds/registry.ts`, `packages/pipeline/src/kinds/builtin.ts` and `packages/pipeline/src/checks/builtin.ts` (F123-FR-010)
- [x] T074 [US4] Implement setup semantics (`[READY]`, `setup-required`, `existing-prerequisite`) and the stage-timed precondition in `packages/pipeline/src/kinds/setup.ts` (F123-FR-010)

**Checkpoint**: a sample kind runs as a stage with no core change

---

## Phase 7: User Story 5 - A consumer sees the plan before anything runs (Priority: P2)

**Goal**: the dry-run plan, and the parallel plan when parallel units are on.

**Independent Test**: a dry run exits 0, writes nothing, and prints one `[DIGEST] state=dry-run`.

- [x] T075 [P] [US5] Characterization test CT-123-105: a dry run with and without `--implement` and `--smoke` creates 0 files, executes 0 actions, prints exactly one dry-run digest, `command_success` reads `deferred`, in `tests/characterization/123/dry-run.test.ts` (measures F123-SC-005)
  - proves: F123-FR-005
- [x] T076 [P] [US5] Characterization test CT-123-106: with parallel units on the dry-run plan holds the parallel plan; with them off and under `parity` it holds no line about it, in `tests/characterization/123/dry-run-parallel.test.ts`
  - proves: F123-FR-006
- [x] T077 [US5] Implement the read of the stored or derived parallel plan in the dry run in `packages/pipeline/src/entry/dry-run.ts` (F123-FR-006)

**Checkpoint**: the plan is printed, nothing runs

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T078 [P] Add the characterization tests of the executor that no parity fixture reaches, in `tests/characterization/123/executor.test.ts`: arguments and precedence (CT-123-101), child environment (CT-123-103), the stage graph and its groups of one (CT-123-119), the events (CT-123-118), the request kind `engine` (CT-123-120)
  - proves: F123-FR-001; F123-FR-003; F123-FR-018; F123-FR-019; F123-FR-020
- [x] T079 [P] Add a test that every id in `contracts/` equals the id in the spec and that the data files of the package equal those of `contracts/` (the two tables byte for byte; `lines.json` and `stage-kinds.json` entry for entry with the files T005 builds them from), in `tests/characterization/123/contracts-equal.test.ts`
- [x] T080 Run the macOS runner for the stage child terminal, the signals and the process groups; record `verified-on` and the version on F123-FR-011 and F123-FR-014 (both `unverified` until then)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [x] T081 Run quickstart.md end to end and update `docs/ecosystem/` only through the orchestrator's report (Stage B rule)

### Added after the cross-feature review (2026-09-30)

- [x] T082 [P] [US1] Characterization test CT-123-142, part 1, in `tests/characterization/123/relaunch-observe-table.test.ts`: the golden decision of every row of table 1, O-01 to O-34 (F123-FR-028), among them the rows O-33 and O-34; the two rows stand between O-24 and O-25; row O-33 fires under every profile, the `parity` profile included, and under the `parity` profile only O-34 is inactive, so the table decides a run that is not blocked as the baseline (CQ-238); the property that exactly one row fires for every vector of the finite domains of the signals, the three new signals included; an absent or unreadable terminal record gives `blocked` false and `retryable` false (measures F123-SC-008)
  - proves: F123-FR-042; F123-FR-028
- [x] T083 [P] [US1] Characterization test CT-123-142, part 2, in `tests/characterization/123/blocked-never-relaunched.test.ts`: a matrix of the six blocked reasons (`declared-block`, `quota-credit`, `auth`, `budget-cap`, `quota-wait-ceiling`, `source-changed`) by the two values of `relaunch.owner`, on a stage that lists the engine exit for retry and allows the stop reason, with relaunch budget left. With `root` the runtime root refuses at R-03; with `supervise`, `supervise observe` refuses at O-33. The matrix runs under the default profile and under the `parity` profile, with the same result (CQ-238). In every cell the count of relaunches is 0, no `supervisor.relaunch` event and no relaunch header in the launch log exists, the refusal names `blocked-on-human` and the command `resume`, and the pipeline ended 22 with the state `failed`. The same matrix with `retryable: false` and no blocked reason, outside the `parity` profile, gives `stop-not-retryable` and 0 relaunches. The counter-case, for both owners: a stop by `wall_budget` with `retryable: true` and no blocked reason is relaunched (CQ-192). The engine stub writes the terminal records; no model is called (measures F123-SC-010)
  - proves: F123-FR-042; F123-FR-030
- [x] T084 [US2] Implement the signals `blocked`, `retryable` and `parityProfile` of table 1 and the read of the terminal record by `supervise observe` in `packages/pipeline/src/relaunch/observe-table.ts`; the synthesized terminal record carries `retryable: false`, in `packages/pipeline/src/executor/outcome.ts` (F123-FR-042). After T049 and T017
- [x] T085 [P] [US2] Characterization test CT-123-143 in `tests/characterization/123/digest-product-line.test.ts`: in default output the runtime prints `[SPECSTRIDE-DIGEST]` once, on the line before the digest line, with the keys `run`, `comment`, `changed`, `delegated`, `critic`, `fallback`, `alerts` in that order; a key without a fact is left out; a line with `run` only is not printed; nothing is printed in compatibility output, in a dry run or under the `parity` profile; no value holds text from a run. The same test asserts that no verb of `supervise` prints `[SPECSTRIDE-LAUNCH]`, `[SPECSTRIDE-STOP]` or `[SPECSTRIDE-STATE]`, and that its four lines carry the labels `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `[SPECSTRIDE-SUPERVISE-STATE]`, `[SPECSTRIDE-SUPERVISE-STOP]` and `[SPECSTRIDE-SUPERVISE-DIGEST]`
  - proves: F123-FR-043; F123-FR-039
- [x] T086 [US2] Implement the line `[SPECSTRIDE-DIGEST]` from the events of the run in `packages/pipeline/src/output/digest.ts`, and the four labels of `supervise` in `packages/pipeline/data/lines.json` and `packages/pipeline/src/supervisor/lines.ts` (F123-FR-043, F123-FR-039)
- [x] T087 [P] Characterization test CT-123-144 in `tests/characterization/123/no-terminal-tool.test.ts`: with a search path that holds no terminal tool (`script`), and with a fake tool that fails to start, a stage of kind `specstride` with colour on and no terminal on standard output runs its child through the pipe, the output is echoed and logged without escape sequences, one `[WARN]` line names the tool, the stage and the run end as they do with the tool present, and preflight and the launch checks do not fail
  - proves: F123-FR-011
- [x] T088 [P] Characterization test CT-123-145 in `tests/characterization/123/doctor-terminal-tool.test.ts`: the doctor check of the terminal tool is registered, is not launch-blocking, gives a warning with its fix hint when the injected probe finds no tool, gives no finding when it finds one, writes nothing, and a launch with the tool absent is not refused
  - proves: F123-FR-044
- [x] T089 Implement the fallback to the pipe in `packages/pipeline/src/executor/child.ts` and register the doctor check of the terminal tool, with an injected probe and `lb` false, in `packages/pipeline/src/launch-checks/register.ts` (F123-FR-011, F123-FR-044). Name the tool as an optional system requirement in the README of the package
- [x] T090 Extend the characterization test CT-123-118 in `tests/characterization/123/executor.test.ts`: `pipeline.started` and `pipeline.ended` pair for every launch and relaunch; `digest.written` is written once with the digest; `launch.checked` is written for the checks that the root verifies; a dry run and the two start-up refusals write no event. After T078, which creates the file
  - proves: F123-FR-018
- [x] T091 [P] Measure the starting values of the Performance Goals of `plan.md` in `tests/characterization/123/performance.test.ts`, against the engine stub: a dry run of a launch contract of 20 stages (goal 1 s), one evaluation of each classifier table (goal 1 ms), one `observe` reading (goal 100 ms). The values have low confidence: the test reports each measured value, and a value above its goal is a warning of the build and not a failure

---

## Dependencies & Execution Order

- Phase 1, then Phase 2 (blocking). T005 is first, because T007 reads its line table; T006 to T009 and T019 are parallel; T010 to T018 are sequential inside the executor, and T020 follows them.
- The registries and the built-in kinds and checks (T072, T073, T074 of Phase 6) are done inside Phase 2, before T010: the checkpoint of Phase 2, US1 and US3 need them. The rest of US4 (T071: the sample and the conformance suite) needs Phase 2 only.
- US1 needs the terminal record (feature 101) and the ledger (feature 103) as ports; their fakes are enough for the tests of Phase 3.
- US2 needs the launch record and the detach strategy (feature 122) as ports; a fake strategy is enough.
- US3 needs Phases 2 to 4, with T073 and T074, and the scenarios of T068. US4 and US5 need Phase 2 only.
- Within a story: tests first (they fail), then data and modules, then wiring.
- T082 and T083 need T005 and the engine stub; T084 needs T017 and T049; T086 needs T018 and T048; T089 needs T014 and T040; T090 needs T078; T091 needs Phases 2 to 4. No task of this list is a paid probe.

## Parallel Execution Examples

- Phase 2: T006, T007, T008, T009 and T019 together, after T005.
- Phase 3 tests: T021 to T026 together.
- Phase 5: T050 to T067 together, once T068 is done.

## Implementation Strategy

MVP is Phase 1, Phase 2 (with T072, T073 and T074) and User Story 1: a pipeline that runs and relaunches itself. Then User Story 2 (supervision), then User Story 3 (parity, the release condition), then the two P2 stories. Every parity test passes before any release (ruling 32).
