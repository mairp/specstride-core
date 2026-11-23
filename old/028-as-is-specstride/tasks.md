---

description: "As-is task baseline for Specstride, reverse-engineered from HEAD 9cab15d"
---
<!-- specstride-reverse: tasks=done -->

# Tasks: Specstride As-Is

**Input**: Design documents from `/old/028-as-is-specstride/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The source tree already carries pytest modules beside the code in `lib/`. The test tasks below record those existing modules; they describe what exists, not new tests to write.

**Organization**: Tasks are grouped by user story. Every task is ticked `[x]` because each one describes work the evidence (spec.md, plan.md, research.md, data-model.md, contracts/) shows already exists at HEAD `9cab15d`. This is a baseline that `/speckit.converge` or a later run can extend; it is not a record of the historical build order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5 from spec.md)
- Every description names the exact file path that holds the behavior

## Path Conventions

- **Single flat CLI project**: bash entry scripts at the repository root (`specstride`, `orchestrator.sh`, `proposer.sh`, `specstride-lib.sh`) and every Python module with its pytest module beside it in `lib/` (see plan.md, *Structure Decision*). There is no `src/` or `tests/` split.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository layout, configuration surface and CI that every story relies on

- [x] T001 Flat project layout with root bash entry scripts and Python modules plus tests in lib/, as recorded in old/028-as-is-specstride/plan.md
- [x] T002 [P] Every SPECSTRIDE_* knob and its default listed in .env.example, including Loki and OpenTelemetry shipping off by default with endpoints localhost:3100 and localhost:4318 (FR-022)
- [x] T003 [P] CI lint (bash -n, shellcheck -S error) and test (pytest -n 16, Python 3.13) jobs, with 10- and 30-minute timeouts, in .github/workflows/ci.yml (FR-030, SC-008)
- [x] T004 [P] Vendored Spec Kit templates used by reverse mode and task grammar in lib/speckit_templates/
- [x] T005 [P] Environment aliasing and state-directory resolution shared by the bash scripts in specstride-lib.sh

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The spec grammar, the backend registry and the run lock that every user story depends on

**⚠️ CRITICAL**: No user story can run without these

- [x] T006 [P] One spec grammar that auto-detects `native`, `speckit-tasks` and `openspec-change` from an explicit override, then filename, then content, and rejects an unknown explicit format, in lib/specstride_spec.py (FR-002)
- [x] T007 [P] One backend registry for proposer and critic backends (dsh, claude, codex, bebop, prime) with per-backend qualifier spelling in lib/backends.py (FR-021)
- [x] T008 Orchestrator defaults of proposer `dsh` and critic `claude` read from the registry in orchestrator.sh (FR-021)
- [x] T009 Spec resolution without `-s` (SPECS.md, then feature.json, then exactly one specs/*/tasks.md or openspec candidate, else list every location and exit 3) in orchestrator.sh (FR-001)
- [x] T010 One run per workdir via an exclusive flock on the state-dir lock (or a lock.d directory fallback), exit 5 when held, in orchestrator.sh (FR-004)
- [x] T011 `--verification` restricted to off, plan or required (default required, exit 3 otherwise) in orchestrator.sh (FR-020)
- [x] T012 [P] Existing grammar tests in lib/test_specstride_spec.py and registry tests in lib/test_backend_registry.py

**Checkpoint**: Foundation present - the phase loop can run

---

## Phase 3: User Story 1 - Drive a Spec Kit feature phase by phase behind a critic gate (Priority: P1) 🎯 MVP

**Goal**: A proposer works each unapproved phase until it writes evidence; a nonce-bound critic approves or rejects it; rejections are retried a bounded number of times.

**Independent Test**: Copy examples/speckit-tasks.example.md to a `specs/001-greeting/tasks.md`, run `specstride run -w <dir>`, and observe the gate files under the feature's `gates/` directory (see spec.md, User Story 1).

### Tests for User Story 1

- [x] T013 [P] [US1] Existing critic tests in lib/test_critic.py
- [x] T014 [P] [US1] Existing orchestrator verification tests in lib/test_orchestrator_verification.py
- [x] T015 [P] [US1] Existing checkbox-tick tests in lib/test_specstride_spec_tick.py

### Implementation for User Story 1

- [x] T016 [US1] Phase derivation as the first phase lacking GATE<N>-APPROVED unless `--start-phase` is given, with release verification and exit 0 when all are approved, in orchestrator.sh (FR-003, SC-001)
- [x] T017 [US1] Per-call nonce and verdict parsing that accepts exactly one `VERDICT <nonce>: APPROVED|REJECTED` line and yields MALFORMED otherwise in lib/critic.py (FR-005, SC-002)
- [x] T018 [US1] Empty GATE<N>-APPROVED marker on approval, GATE<N>-FEEDBACK.md plus exit 10 on rejection or MALFORMED, in lib/critic.py (FR-006)
- [x] T019 [US1] Archiving of rejected evidence, feedback, hint, acceleration note and newest verdict transcript into attempts/phase<N>/attempt<M>/ in orchestrator.sh (FR-007)
- [x] T020 [US1] Retry until MAX_REJECTS (default 3) then halt with exit 2 and the rejection trail in orchestrator.sh (FR-008, SC-004)
- [x] T021 [US1] Oscillation halt (criterion cleared then re-rejected) with exit 2 in orchestrator.sh (FR-009)
- [x] T022 [US1] Consecutive-MALFORMED limit (default 3, 0 disables) halting with exit 1 and `run_stop reason=critic_unavailable` in orchestrator.sh (FR-010)
- [x] T023 [US1] Post-approval ticking of the phase's task checkboxes (not native, off with SPECSTRIDE_TICK_TASKS=false; a failed tick is only logged) in orchestrator.sh (FR-013)
- [x] T024 [US1] Post-approval `git add -A` and `specstride: phase <N> approved — <title>` commit when SPECSTRIDE_GIT_COMMITS is auto, never init or push, in orchestrator.sh (FR-014)
- [x] T025 [US1] Proposer idle, disk-progress and repetition watchdogs (repetition default 12 in code; README says 5) in proposer.sh (FR-017)
- [x] T026 [US1] Consecutive-error and hard-cap breakers in proposer.sh, and wall-clock budget / MAX_ITER exit 4 in orchestrator.sh (FR-018)
- [x] T027 [US1] Clean pass yield through a specstride-pass-yield/v1 artifact with poll, per-attempt cap and gated `command` predicate in proposer.sh (FR-019)

**Checkpoint**: The core loop exists and is covered by the modules above

---

## Phase 4: User Story 2 - Recover a stuck phase with the diagnostician and the accelerator (Priority: P2)

**Goal**: A new unmet-criteria signature triggers one tool-free diagnostician pass and a single narrowed accelerator attempt.

**Independent Test**: Force a rejection naming new T### IDs and observe GATE<N>-HINT.md, the `.diagnosed-phase<N>` marker and an `accelerator_start` event (see spec.md, User Story 2).

### Implementation for User Story 2

- [x] T028 [US2] Diagnostician mode (`--diagnose`) that writes the hint in lib/critic.py (FR-011)
- [x] T029 [US2] Signature comparison against `.diagnosed-phase<N>`, diagnostician invocation with the critic backend and SPECSTRIDE_DIAGNOSTICIAN=false opt-out in orchestrator.sh (FR-011, SC-005)
- [x] T030 [US2] Accelerator-due rule (enabled, previous attempt not an accelerator, hint and feedback present, signature not yet accelerated) in orchestrator.sh (FR-012, SC-005)

**Checkpoint**: Recovery path exists on top of User Story 1

---

## Phase 5: User Story 3 - Inspect and control a run from a second terminal (Priority: P3)

**Goal**: The front door shows run state and stops or resumes a run.

**Independent Test**: With a run active, run `specstride status`, `specstride events --json` and `specstride stop`, then `specstride resume` (see spec.md, User Story 3).

### Tests for User Story 3

- [x] T031 [P] [US3] Existing front-door tests in lib/test_specstride_cli.py
- [x] T032 [P] [US3] Existing state-dir tests in lib/test_specstride_state_dir.py

### Implementation for User Story 3

- [x] T033 [US3] Front door routing `run` and leading flags to the orchestrator and exposing status, watch, tail, events, verdicts, feedback, phases, stop, resume, learn and reverse in specstride (FR-023)
- [x] T034 [US3] `specstride stop` writing stop.flag and `--now` killing the recorded proposer tree in specstride, honoured with exit 6 in orchestrator.sh (FR-015)
- [x] T035 [US3] `specstride resume` refusing while the lock is held and replaying last-run.conf with extra arguments last-wins in specstride (FR-016)
- [x] T036 [US3] Terminal presentation of status and events in lib/present.py

**Checkpoint**: Run inspection and control exist

---

## Phase 6: User Story 4 - Reverse-engineer an existing codebase into an as-is Spec Kit feature (Priority: P4)

**Goal**: `specstride reverse <SRC>` produces an inventory, a phased driver spec and a linted, guarded as-is feature.

**Independent Test**: Run `python3 lib/reverse.py lint` and `python3 lib/reverse.py guard` against a feature directory and its baseline (see spec.md, User Story 4).

### Tests for User Story 4

- [x] T037 [P] [US4] Existing reverse tests in lib/test_reverse.py
- [x] T038 [P] [US4] Existing inventory tests in lib/test_reverse_inventory.py

### Implementation for User Story 4

- [x] T039 [P] [US4] Deterministic source inventory in lib/reverse_inventory.py
- [x] T040 [US4] Default output naming specs/NNN-as-is-<slug>/ and refusal of source root, outside-source, .git, state-dir, .specify or non-empty outputs in lib/reverse.py (FR-025)
- [x] T041 [US4] Guard re-walking the source against the baseline and failing on added, deleted or changed files, a moved HEAD or new git status entries in lib/reverse.py (FR-026, SC-006)
- [x] T042 [US4] Per-level linter of owned artifacts (template sections, placeholders, story format, evidence comments) in lib/reverse.py (FR-027)

**Checkpoint**: Reverse mode exists and drives the ordinary loop

---

## Phase 7: User Story 5 - Let the loop suggest and apply per-phase settings from its own telemetry (Priority: P5)

**Goal**: `specstride learn` suggests, applies and reverts allowlisted per-phase knobs.

**Independent Test**: Run `specstride learn --show` and then `--apply`, and observe an append-only entry in `learning/applied.json` (see spec.md, User Story 5).

### Tests for User Story 5

- [x] T043 [P] [US5] Existing learn tests in lib/test_learn.py

### Implementation for User Story 5

- [x] T044 [US5] Allowlist of proposer_timeout (minimum 900 s, at most 2x default) and yield_poll_interval (10–300 s) with at most ±50% change per step in lib/learn.py (FR-024)

**Checkpoint**: All five user stories are present in the source

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, optional telemetry, the config-home overlay, the single spec-grammar owner and the test suite/CI shared by all stories

- [x] T045 [P] Operator documentation of commands and knobs in README.md (its repetition default of 5 contradicts the code, FR-017)
- [x] T046 [P] Wiki pages for architecture, CLI reference and configuration in wiki/
- [x] T047 [P] Loki shipper in lib/ralph_loki_ship.py and OpenTelemetry shipper in lib/ralph_otel_ship.py, both off by default (FR-022)
- [x] T048 [P] Optional local telemetry stack in telemetry/docker-compose.yml
- [x] T049 [P] Example Spec Kit and OpenSpec task files in examples/
- [x] T050 [P] Generic throwaway config-home overlay plumbing: the optional `overlay` field in lib/backends.py (declared by no shipped backend, so every backend resolves to scope `none`) and its application in lib/backend_overlay.py (FR-028, SC-007)
- [x] T051 [P] Single owner of the T006 grammar in lib/specstride_spec.py, reached through the specstride_spec_* shims in specstride-lib.sh and by lib/critic.py (FR-029)
- [x] T052 [P] pytest suite under lib/ kept hermetic from host telemetry settings by lib/conftest.py, run by the CI test job recorded in T003 (FR-030, SC-008)

---

## Dependencies & Execution Order

This order is reconstructed from code dependencies at HEAD `9cab15d`. It is not the historical order in which the code was written (git history was not used to derive it).

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup (the orchestrator sources specstride-lib.sh and reads .env.example knobs) - blocks every user story
- **User Story 1 (Phase 3)**: Depends on Foundational (spec grammar, backend registry, lock)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (it runs inside the rejection branch of the phase loop)
- **User Story 3 (Phase 5)**: Depends on Foundational and on the state files User Story 1 writes (lock, stop.flag, last-run.conf, events)
- **User Story 4 (Phase 6)**: Depends on User Story 1 (reverse mode runs the ordinary loop over a driver spec)
- **User Story 5 (Phase 7)**: Depends on User Story 1 (it reads the loop's recorded runs)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational - no dependency on other stories
- **User Story 2 (P2)**: Extends User Story 1 inside orchestrator.sh and lib/critic.py
- **User Story 3 (P3)**: Reads state written by User Story 1; independent of US2, US4 and US5
- **User Story 4 (P4)**: Uses User Story 1 as its runner; its lint and guard in lib/reverse.py are independent
- **User Story 5 (P5)**: Reads User Story 1 telemetry; independent of US2–US4

### Within Each User Story

- Tests live beside the module they cover in lib/
- Tasks naming the same file (orchestrator.sh, lib/critic.py, proposer.sh, specstride, lib/reverse.py) are sequential and carry no [P]

### Parallel Opportunities

- T002–T005 in Setup touch different files
- T006, T007 and T012 in Foundational touch different files
- The test tasks of each user story touch different files
- US3, US4 and US5 touch disjoint files once User Story 1 exists
- T045–T052 in Polish touch different files

---

## Parallel Example: User Story 1

```bash
# The existing test modules for User Story 1 are independent of each other:
Task: "Existing critic tests in lib/test_critic.py"
Task: "Existing orchestrator verification tests in lib/test_orchestrator_verification.py"
Task: "Existing checkbox-tick tests in lib/test_specstride_spec_tick.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: User Story 1 - the phase loop with the critic gate is the minimum usable product

### Incremental Delivery

1. Setup + Foundational → the loop's prerequisites
2. User Story 1 → the core loop
3. User Story 2 → recovery of stuck phases
4. User Story 3 → inspection and control
5. User Story 4 → reverse mode
6. User Story 5 → learning

### Parallel Team Strategy

After User Story 1, User Stories 3, 4 and 5 touch disjoint files (specstride and lib/present.py, plus the stop.flag check T034 records in orchestrator.sh; lib/reverse.py and lib/reverse_inventory.py; lib/learn.py) and can be extended in parallel.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map each task to a user story in spec.md
- Every FR-001 … FR-030 from spec.md is named by at least one task
- SC-001, SC-002, SC-004, SC-005 and SC-006 are named by T016, T017, T020, T029/T030 and T041; SC-003 (the exit-code map) is spread over the tasks that record each exit: T009/T011 (3), T010 (5), T016 (0), T020/T021 (2), T022 (1), T026 (4) and T034 (6); SC-007 (overlay) and SC-008 (tests/CI) are named by T050 and T003/T052
- Every task is `[x]`: it records existing behavior, not planned work
