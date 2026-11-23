---

description: "Task list template for feature implementation"
---
<!-- specstride-reverse: tasks=done -->

# Tasks: mixture-of-loops (as-is)

**Input**: Design documents from `/old/011-as-is-mixture-of-loops/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The repository already carries `unittest` suites (`tests/`), so the test tasks below record suites that exist today. Every task is ticked because the evidence shows the work already exists at commit `9c88f86`; this list is a baseline, not a backlog.

**Organization**: Tasks are grouped by user story, in the priority order of `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 … US6)
- Every description names the exact file path that holds the work

## Path Conventions

- Single package: product code in `skills/mixture-of-loops/`, installer in `bin/`, tests in `tests/` at repository root (see `plan.md` *Structure Decision*)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository layout, CI and merge configuration that exist today

- [x] T001 Canonical skill package directory with `SKILL.md`, `agents/openai.yaml`, `references/` and `assets/` in skills/mixture-of-loops/SKILL.md
- [x] T002 [P] Harness discovery symlinks `.agents/skills/mixture-of-loops` and `.claude/skills/mixture-of-loops` pointing at `../../skills/mixture-of-loops`
- [x] T003 [P] CI syntax check and `unittest` matrix on Python 3.10–3.13 with 10-minute jobs and a fan-in `ci` job in .github/workflows/ci.yml
- [x] T004 [P] Squash-merge queue gated on the `automerge` label and the `ci` check in .mergify.yml
- [x] T005 [P] Weekly GitHub Actions dependency bumps labelled `automerge` in .github/dependabot.yml
- [x] T006 [P] Test collection limited to `tests/` without recursing into fixtures in pytest.ini

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared library, schema and fixtures every story depends on

**⚠️ CRITICAL**: Every user story below consumes these modules

- [x] T007 Launch-contract JSON schema (`schema_version` 1.0) in skills/mixture-of-loops/assets/launch-contract.schema.json
- [x] T008 Shared contract loading, path resolution, hashing and exit-code constants in skills/mixture-of-loops/scripts/contract_lib.py
- [x] T009 Legacy `wiggum` stage kind and legacy spellings normalized in memory to Specstride spellings and reported as warnings (FR-027) in skills/mixture-of-loops/scripts/contract_lib.py
- [x] T010 `warn_if_not_shell_invoked` stderr reminder when `MOL_VIA=shell` is absent, leaving exit code and stdout unchanged (FR-026) in skills/mixture-of-loops/scripts/contract_lib.py
- [x] T011 [P] Contract and derivation references read by the model in skills/mixture-of-loops/references/contract.md and skills/mixture-of-loops/references/derivation.md
- [x] T012 [P] Hermetic fixture repositories `greeting-blocked` and `greeting-ready` with expectations in tests/fixtures/derive_expectations.py

**Checkpoint**: Foundation present - the user-story work below builds on it

---

## Phase 3: User Story 1 - Derive a validated launch contract and launcher (Priority: P1) 🎯 MVP

**Goal**: Turn Spec Kit feature artifacts into a promoted contract, a content-addressed bundle and a thin Bash launcher.

**Independent Test**: Run the three scripts against `tests/fixtures/repos/greeting-ready`; expect a `validated` contract with a promotion stamp, a launcher passing `bash -n`, and a `--dry-run` that exits 0.

### Tests for User Story 1

- [x] T013 [P] [US1] Bootstrap, validation and rendering unit tests in tests/test_mixture_of_loops.py
- [x] T014 [P] [US1] Fixture expectation tests for `greeting-ready` in tests/test_fixtures.py

### Implementation for User Story 1

- [x] T015 [US1] `resolve_features` and `source_files` record each source's relative path, kind, SHA-256, line count and a checkbox-insensitive `tasks.md` semantic hash (FR-001) in skills/mixture-of-loops/scripts/bootstrap_contract.py
- [x] T016 [US1] `build_contract` emits status `draft`, `authorized_roots`, task/shell/prerequisite/verification inventory, one `unresolved` coverage entry per task and the blocker `semantic-derivation-required` (FR-002) in skills/mixture-of-loops/scripts/bootstrap_contract.py
- [x] T017 [US1] Strict validation of schema version, kebab-case id, `validated` status, bootstrap provenance, absolute repository root and in-root paths (FR-004) in skills/mixture-of-loops/scripts/contract_lib.py
- [x] T018 [US1] `--promote` writes `validated` with a promotion stamp only when strict validation passes (FR-006) in skills/mixture-of-loops/scripts/validate_contract.py
- [x] T019 [US1] `publish_bundle` writes `.mixture-of-loops/generated/<id>/<hash20>/` with the canonical contract, `runtime.py` and `contract_lib.py`, reusing a bundle only on hash match (FR-009) in skills/mixture-of-loops/scripts/render_launcher.py
- [x] T020 [US1] `launcher_text` emits a Bash launcher with the `mixture-of-loops-generated` marker and `generated-content-sha256` that `exec`s the bundled runtime (FR-010) in skills/mixture-of-loops/scripts/render_launcher.py
- [x] T021 [US1] `dry_run` prints preflight and stage plans without executing actions and ends with a `state=dry-run exit=0` digest line (FR-011) in skills/mixture-of-loops/scripts/runtime.py

**Checkpoint**: User Story 1 is functional on its own

---

## Phase 4: User Story 2 - Refuse to produce a pipeline that is draft, blocked or stale (Priority: P2)

**Goal**: Keep unreviewed or out-of-date contracts from becoming executable launchers.

**Independent Test**: Run the scripts against `tests/fixtures/repos/greeting-blocked`; `--promote` exits 20, the contract stays `draft`, and the renderer refuses it.

### Tests for User Story 2

- [x] T022 [P] [US2] Fixture expectation for `greeting-blocked` with its blocker at `plan.md` line 17 in tests/fixtures/expectations/greeting-blocked.json
- [x] T023 [P] [US2] End-to-end refusal logic tests in tests/test_e2e_logic.py

### Implementation for User Story 2

- [x] T024 [US2] Reject open blocker findings and `unresolved` or `unsupported` coverage entries (FR-005) in skills/mixture-of-loops/scripts/contract_lib.py
- [x] T025 [US2] On a refused promote reset the contract to `draft` and print `next:` hints via `derivation_hints` (FR-006) in skills/mixture-of-loops/scripts/validate_contract.py
- [x] T026 [US2] Source-hash staleness check exiting 23 except for checkbox-only `tasks.md` changes (FR-007) in skills/mixture-of-loops/scripts/contract_lib.py
- [x] T027 [US2] Renderer re-validates strictly, checks the promotion stamp and refuses to overwrite an edited launcher without `--replace-edited` (FR-008) in skills/mixture-of-loops/scripts/render_launcher.py

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Run the pipeline unattended with resume and a final digest (Priority: P3)

**Goal**: Execute the rendered pipeline with locking, preflight, retry, resume and a final digest.

**Independent Test**: Run the `greeting-ready` launcher against `tests/e2e/exec-stub-bin/specstride`; `state.json` reaches `completed` and the launcher prints a `state=completed exit=0` digest.

### Tests for User Story 3

- [x] T028 [P] [US3] Tier 2 execution tests against the pipeline-acting stub in tests/test_execution_e2e.py
- [x] T029 [P] [US3] Pipeline-acting `specstride` stub in tests/e2e/exec-stub-bin/specstride

### Implementation for User Story 3

- [x] T030 [US3] Exit 23 on stale sources and 20 on an invalid contract, each with a `state=failed` digest line (FR-011) in skills/mixture-of-loops/scripts/runtime.py
- [x] T031 [US3] Run state under `.mixture-of-loops/runs/<id>/` with a non-blocking exclusive lock, exit 24 when held (FR-012) in skills/mixture-of-loops/scripts/runtime.py
- [x] T032 [US3] Preflight over every enabled stage exiting 21 with `exit_reason` `preflight` (FR-013) in skills/mixture-of-loops/scripts/runtime.py
- [x] T033 [US3] In-order stage execution with smoke skipping, resume of completed stages, digest-change reset and `state.json` records (FR-014) in skills/mixture-of-loops/scripts/runtime.py
- [x] T034 [US3] `stage_should_retry` retries only declared exit codes and stop reasons within attempts and timeout, ending with exit 22 or 128 plus signal (FR-015) in skills/mixture-of-loops/scripts/runtime.py
- [x] T035 [US3] `resolve_env` strips inherited `SPECSTRIDE_LEARNING`/`WIGGUM_LEARNING` and sets `SPECSTRIDE_LEARNING=off` for `specstride` stages (FR-016) in skills/mixture-of-loops/scripts/runtime.py

**Checkpoint**: User Stories 1–3 work independently

---

## Phase 6: User Story 4 - Harness-supervised `run` and `auto` modes (Priority: P4)

**Goal**: Let the harness select a mode, gate, launch, watch and relaunch a generated launcher from telemetry.

**Independent Test**: Use `supervise.py gate` and `supervise.py auto` on the `greeting-ready` launcher with the stub; expect `[MOL-LAUNCH]`, at least one `[MOL-STATE]` and a `[MOL-DIGEST]` matching the launcher's own digest.

### Tests for User Story 4

- [x] T036 [P] [US4] Supervision unit tests for mode, gate, launch and relaunch in tests/test_supervision.py

### Implementation for User Story 4

- [x] T037 [US4] `select_mode` defaults to `generate`, honours explicit tokens and maps execution phrasing to `auto` or `run` (FR-017) in skills/mixture-of-loops/scripts/supervisor_lib.py
- [x] T038 [US4] `gate` evaluates the six ordered checks, names the first failure and marks later checks `not-evaluated` (FR-019) in skills/mixture-of-loops/scripts/supervisor_lib.py
- [x] T039 [US4] `launch` starts the launcher from an argv array with `--no-color`, closed stdin, a new session and `harness-launch.log`, writing `harness-run.json` (FR-020) in skills/mixture-of-loops/scripts/supervisor_lib.py
- [x] T040 [US4] `classify_relaunch` permits a relaunch only for classified transient stage failures with unchanged digests and remaining budget (FR-021) in skills/mixture-of-loops/scripts/supervisor_lib.py
- [x] T041 [US4] Relaunch budget default 2 and `configuration.auto` bound of 0–5 relaunches with stage-derived wall clock (FR-022) in skills/mixture-of-loops/scripts/contract_lib.py
- [x] T042 [US4] Labelled `[MOL-MODE]`…`[MOL-DIGEST]` report lines and the final digest fields (FR-023) in skills/mixture-of-loops/scripts/supervisor_lib.py
- [x] T043 [US4] Harness-side CLI subcommands `mode`, `resolve`, `gate`, `launch`, `watch`, `observe`, `auto`, `stop` (`learning` and `retro` are US6, T049 and T050) in skills/mixture-of-loops/scripts/supervise.py

**Checkpoint**: User Stories 1–4 work independently

---

## Phase 7: User Story 5 - Onboard the skill into each harness (Priority: P5)

**Goal**: Link the one canonical skill directory into codex, claude, dsh, pi and prime.

**Independent Test**: Run `bin/onboard-skill --harness all --scope user` under a temporary `HOME`; the links exist and `--check` exits 0.

### Tests for User Story 5

- [x] T044 [P] [US5] Onboarding tests for every harness and exit code in tests/test_onboarding_harnesses.py
- [x] T045 [P] [US5] Tier 2 harness discovery tests in tests/test_harness_discovery.py

### Implementation for User Story 5

- [x] T046 [US5] Linker with `--harness`, `--scope`, `--check`, `--repair` and exits 2–7 (FR-025) in bin/onboard-skill

**Checkpoint**: User Stories 1–5 work independently

---

## Phase 8: User Story 6 - Bind Specstride learning mode and read a retrospective (Priority: P6)

**Goal**: Bind Specstride's learning decisions into the contract and write a read-only retrospective.

**Independent Test**: Call `supervise.py learning --request "…"` with and without learning phrases (default `off`, `apply` only for explicit phrases); run `retro` and confirm it writes only under the run directory.

### Tests for User Story 6

- [x] T047 [P] [US6] Learning-mode selection, decision-log binding and retrospective tests in tests/test_supervision.py

### Implementation for User Story 6

- [x] T048 [P] [US6] `learning_block` binds mode, last run id, log-prefix SHA-256, effective values and path into `configuration.learning`, default `off` (FR-003) in skills/mixture-of-loops/scripts/bootstrap_contract.py
- [x] T049 [P] [US6] `select_learning_mode` returns `off` by default, `apply` only for explicit phrases, else `suggest` (FR-018) in skills/mixture-of-loops/scripts/supervisor_lib.py
- [x] T050 [US6] `command_retro` writes a per-digest retrospective, reports gaps as `unavailable` and prints `specstride learn --revert` only as a suggestion (FR-024) in skills/mixture-of-loops/scripts/supervise.py

**Checkpoint**: All user stories are independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and cross-story verification that exist today

- [x] T051 [P] User documentation of modes, tiers, exit codes and platform limits in README.md
- [x] T052 [P] Documentation consistency tests in tests/test_docs.py
- [x] T053 [P] Tier 3 live end-to-end gate behind `MOL_LIVE_E2E=1` in tests/test_live_e2e.py
- [x] T054 [P] Live harness runner and home snapshot in tests/e2e/run_harness_e2e.py
- [x] T055 [P] Node probe of pi and prime skill loaders in tests/harness_probe.mjs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup; `contract_lib.py` is imported by every script, so it blocks all user stories
- **User Stories (Phase 3–8)**: Depend on Foundational
- **Polish (Phase 9)**: Documents and exercises all stories

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational; no dependency on other stories
- **User Story 2 (P2)**: Shares `validate_contract.py`, `contract_lib.py` and `render_launcher.py` with US1; its refusals are testable alone on `greeting-blocked`
- **User Story 3 (P3)**: Consumes the bundle and launcher produced by US1
- **User Story 4 (P4)**: Supervises a launcher from US1 executed by the US3 runtime
- **User Story 5 (P5)**: Independent of the pipeline; depends only on the canonical skill directory (T001)
- **User Story 6 (P6)**: Learning binding extends US1's bootstrap; `retro` reads US4 run records

### Within Each User Story

- The test suite and the implementation file are separate files, so the `[P]` test tasks run in parallel with each other
- Tasks that touch the same script (for example the `runtime.py` tasks T030–T035) are sequential

### Parallel Opportunities

- T002–T006 touch different files and run in parallel
- T011 and T012 run in parallel after T007–T010
- Within each story, the `[P]` test tasks run in parallel
- US5 can proceed in parallel with US1–US4

---

## Parallel Example: User Story 1

```bash
# Launch the User Story 1 test suites together:
Task: "Bootstrap, validation and rendering unit tests in tests/test_mixture_of_loops.py"
Task: "Fixture expectation tests for greeting-ready in tests/test_fixtures.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup and Foundational (Phases 1–2)
2. User Story 1: bootstrap → derive → promote → render → dry-run
3. Validate on the `greeting-ready` fixture

### Incremental Delivery

1. US1 (generate) → US2 (refusal) → US3 (unattended run) → US4 (supervision) → US5 (onboarding) → US6 (learning, retrospective)
2. Each story is testable on the existing fixtures without breaking earlier ones

---

## Notes

- Every task is `[x]`: it records work the evidence shows exists at commit `9c88f86`
- [P] tasks = different files, no dependencies
- The FR references map each task to `spec.md` Functional Requirements
