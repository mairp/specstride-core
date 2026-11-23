# Tasks: Host plugin for Claude Code

**Input**: `specs/113-host-claude-code/` (spec.md, plan.md, research.md, data-model.md, contracts/host-package.md)

**Tests**: Requested. Parity tests and characterization tests are required tasks.

**Format**: `[ID] [P?] [Story] Description`. A test task names what it proves.

A task marked **PAID** spends money on model calls. A person starts it, never a job of the build and never a schedule, and its cost is logged. No PAID task is a precondition of a test: every test runs on fixtures, stubs and recorded results (`assumption: CQ-188`). The PAID tasks are T001, T029 and T037.

**Paths**: package `packages/host-claude-code/` (`@specstride/host-claude-code`); parity tests in `tests/parity/113/`; characterization tests in `tests/characterization/113/`; the host conformance suite in `packages/testkit/src/conformance/EP-01/`, its sample in `packages/testkit/src/samples/EP-01/`.

## Phase 1: Setup and captures

- [x] T001 **PAID** Live capture on Claude Code 2.1.284 (a paid probe: model calls; a person starts it; it MUST be logged; not run by this specification): lifetime and re-arming of a re-waking host hook, the search path of host hooks for `bin`, numeric limits of host hook events, firing of session start on resume and compact, the host limit events, a Tier 1 child, the isolation setting of background sessions, the version floor of manifest options, whether a marketplace entry can pin one exact version, the npm source and the version rule of a plugin entry, the first audience notice, the six capabilities of the host, a run ended by a usage limit. Record each fact with `verified-on` and pin. It is a precondition of no test and of no other task: until it has been run the facts stay `unverified` and the declared fallbacks apply.
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - verifies the facts of: F113-FR-016; F113-FR-018; F113-FR-021; F113-FR-024; F113-FR-026; F113-FR-027; F113-FR-028; F113-FR-030; F113-FR-032; F113-FR-039; F113-FR-042
- [x] T002 Create `packages/host-claude-code` (`@specstride/host-claude-code`) in the workspace with the layout of plan.md; register it in the import-boundary check
- [x] T003 [P] Add the closed sets of the spec ("Closed sets") to `@specstride/contracts` through the proposed rows
- [x] T004 [P] Record the plain shell host as the second target of the conformance suite

## Phase 2: Foundational

- [x] T005 Implement `describe` with the six capabilities and fallbacks in `packages/host-claude-code/src/describe/` (F113-FR-028, F113-FR-029)
- [x] T006 Implement `renderSkill`, `renderEntry`, `renderStatusHooks` and the budget check in `src/render/` (F113-FR-029, F113-FR-036)
- [x] T007 Implement the shim in `src/shim/`: resolution order, `--protocol`, one refusal line (F113-FR-018, F113-FR-019)

## Phase 3: User Story 1 - Invoke `specstride-run` (P1)

- [x] T008 [US1] Write the skill source `specstride-run`: order of steps, outcome lines, modes, comment, judgment, audience notice, data framing (F113-FR-002 to F113-FR-008, F113-FR-011, F113-FR-016, F113-FR-017)
- [x] T009 [US1] Write the skill source `specstride-reverse` (F113-FR-014)
- [x] T010 [US1] Write the doctor skill source (F113-FR-015)
- [x] T011 [P] [US1] Parity test PT-113-DV009-mode-map-tokens in tests/parity/113/
  - proves: DV-009 mode map (F113-FR-005, F113-FR-006)
  - fixture: FX-36/mode-<case>; FX-36/mode-no-execution-phrasing (waiver DV-009)
- [x] T012 [P] [US1] Characterization test CT-113-1 in tests/characterization/113/: the skill writes no ignore rule and no verification file
  - proves: C-244; B-2661; B-2662
  - fixture: FX-32
- [x] T013 [P] [US1] Characterization test CT-113-2 in tests/characterization/113/: order of steps, dry-run ends after the plan, prohibitions, verbatim relay
  - proves: C-245; B-2663; B-2664; B-2666; B-2667; B-2668
  - fixture: FX-32; FX-36
- [x] T014 [P] [US1] Characterization tests CT-113-101 to CT-113-108 for F113-FR-001 to F113-FR-008 in tests/characterization/113/
  - proves: F113-FR-001 to F113-FR-008
  - fixture: FX-32
- [x] T015 [P] [US1] Characterization tests CT-113-113 to CT-113-117 for the supervision cycle, reverse skill, doctor skill, audience notice (with the marker missing and damaged: the notice is printed once more), data framing, in tests/characterization/113/
  - proves: F113-FR-013 to F113-FR-017
  - fixture: FX-35

## Phase 4: User Story 2 - Host hooks and one-line state (P1)

- [x] T016 [US2] Write the host hook configuration and the thin shell shims: session start, prompt submit, guardrail, host events; no host hook on stop or after a tool use; the status shim finds the line through `workspace:current:status-line` (F113-FR-020 to F113-FR-025)
- [x] T017 [US2] Implement the push-alert way with the monitor as the primary way; change it from the result of T001 only when that task has been run (F113-FR-026)
- [x] T018 [US2] Make the shims silent inside a child of a run (F113-FR-027)
- [x] T019 [P] [US2] Characterization tests CT-113-120 to CT-113-127 in tests/characterization/113/; CT-113-121 covers a missing and a damaged marker of the host: one more line, nothing else
  - proves: F113-FR-020 to F113-FR-027
  - fixture: FX-35

## Phase 5: User Story 3 - Shim refusal (P1)

- [x] T020 [P] [US3] Characterization tests CT-113-118 and CT-113-119 with a stub CLI on protocol 2 and with no CLI, in tests/characterization/113/
  - proves: F113-FR-018; F113-FR-019

## Phase 6: Packaging

- [ ] T021 Write the manifest, the marketplace entry, the explicit plugin version and the strict validation step (F113-FR-030, F113-FR-031). The bundling into the one published package is task T064 of feature 119, `specs/119-front-door-and-presenter/tasks.md` (review item W-119-01)
- [ ] T022 Register the `host.*` doctor checks (F113-FR-033) and the background isolation warning (F113-FR-032)
- [ ] T023 [P] Characterization tests CT-113-128 to CT-113-135 in tests/characterization/113/
  - proves: F113-FR-028 to F113-FR-035
- [ ] T024 Host conformance suite against the plain shell and this plugin, in packages/testkit/src/conformance/EP-01/, with the sample in packages/testkit/src/samples/EP-01/ (F113-FR-034); the survival case is a skip with reason without a live host
  - proves: F113-FR-034
  - fixture: FX-32; FX-35

## Phase 7: User Stories 4 and 5 - Budgets and evals

- [ ] T025 [US4] Implement the seven checks of the context-cost CI and the report file in `packages/host-claude-code/tests/ci-checks/`; the static size check holds the byte limits and the 500-line limit of a skill body (F113-FR-036, F113-FR-037)
- [ ] T026 [P] [US4] Characterization tests CT-113-136 and CT-113-137 in tests/characterization/113/
  - proves: F113-FR-036; F113-FR-037
  - fixture: FX-32; FX-35
- [ ] T027 [US5] Write the trigger cases (six positive and six negative per skill, confusable pair included) and the free graders, with the restriction of tools; no model id in any file; threshold 0.8; no ablation. The task writes files and calls no model (F113-FR-038, F113-FR-039)
- [ ] T028 [P] [US5] Characterization tests CT-113-138 and CT-113-139 in tests/characterization/113/, without a model call: the release check on recorded logs (a run at the threshold on the same hash passes; no run, another hash, or a run under the threshold fails); a run without a configured model is refused before any call; a recorded interrupted run and a recorded usage-limit run are not scored
  - proves: F113-FR-038; F113-FR-039
- [ ] T029 [US5] **PAID** Behaviour smoke with a stub CLI and with-and-without report: a person starts them; no schedule and no job of the build; logged; neither is a check of a change or of a release (F113-FR-040)
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [ ] T030 [P] Characterization test CT-113-140 in tests/characterization/113/, without a model call: no job and no schedule of the build configuration starts the smoke or the report; the form of their log record
  - proves: F113-FR-040

## Phase 8: Polish

- [ ] T031 Run the seven checks on the built package; record `context-budget.json`. The task calls no model; the run of the trigger suite is T037
- [ ] T032 Record the macOS runner run of the startup check as `unverified` until it passes
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.

## Phase 9: Added after the cross-feature review (2026-09-30)

- [ ] T033 [US5] Implement the static check of the suite files and of the build configuration in `packages/host-claude-code/src/evals/`: case counts, confusable pair, restriction of tools, no model id, no job that starts the host's suite runner; and the stub of the host's suite runner with recorded results (F113-FR-041)
- [ ] T034 [P] [US5] Characterization test CT-113-141 in tests/characterization/113/: a suite file with five positive cases fails; a suite file with a model id fails; a build job that starts the host's suite runner fails; the eval driver on the stub gives one result per case and reports the two recorded interruptions as not scored; the test run makes 0 network calls
  - proves: F113-FR-041
- [ ] T035 Implement the release check of the trigger suite, which reads the log of the paid runs and matches the hash of the skill texts, and the writer of the log record (F113-FR-038, F113-FR-039)
- [ ] T036 Write the publishing rule of the host package into the build: the plugin directory is published only inside the package, under the release check of F100-FR-236; the marketplace entry and the documentation name the exact package and version (F113-FR-042)
- [ ] T037 [US5] **PAID** Run the trigger suite on the built package: a person starts it, with the model from the configuration of the run; three runs, threshold 0.8, no ablation; logged with date, model ids, number of calls, cost and the hash of the skill texts. It is a precondition of a release (through the release check of T035) and of no test (F113-FR-038, F113-FR-039)
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [ ] T038 [P] Characterization test CT-113-142 in tests/characterization/113/: a marketplace entry with a version range fails the build; an entry that names another package fails; the plugin directory appears in no publishing step outside the package; the release check of F100-FR-236 (CT-100-336) covers the files of the plugin directory
  - proves: F113-FR-042
