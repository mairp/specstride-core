---
description: "Task list of feature 112-doctor"
---

# Tasks: Doctor (feature 112)

**Input**: Design documents from `specs/112-doctor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. A test task is written before the task it tests and must fail before that task is done. There is no parity test: no baseline has a doctor. Characterization tests are CT-112-1 and CT-112-2; the others are conformance, security and budget tests.

**Format**: `[ID] [P?] [Story] Description`. A test task carries `proves:`. An implementation task carries `covers:`.

**Stories**: US1 a consumer asks whether Specstride is set up; US2 the doctor and the launch agree; US3 a package adds a check; US4 an unverified harness; US5 safe to run anywhere; US6 every host.

**Inherited work**: the first task is a spike (a keychain existence query). Captures of the status commands and of the managed-settings locations belong to the harness adapters and the host package. No paid probe belongs to this feature.

## Phase 1: Setup and spikes

- [x] T001 Spike: find an existence query for a keychain reference that prints no value, on Linux and on macOS; record the result and the tool versions in specs/112-doctor/research.md (a note, not code)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F112-FR-006
  - status: unverified until run; the result decides whether `unprobed` stays on Linux
- [x] T002 Create the package `@specstride/doctor` in packages/doctor/ with `package.json` (no install script), `tsconfig.json` and a test script
  - covers: F112-FR-002
- [x] T003 [P] Copy `specs/112-doctor/contracts/check-catalogue.tsv` into packages/doctor/data/ and add the consistency check of `contracts/README.md` to the build in packages/doctor/test/catalogue-consistency.test.ts
  - covers: F112-FR-002; F112-FR-030

## Phase 2: Foundational

- [x] T004 Test CT-112-1 (characterization of the finding model as extracted from Lisa: id, severity, message, evidence, remedy; injected probes; same result on the same fixture) in packages/doctor/test/finding-model.test.ts
  - proves: F112-FR-001
  - fixture: the probe bag of the test tree
- [x] T005 Implement the finding, the check type and the probe bag in packages/doctor/src/registry/types.ts
  - covers: F112-FR-001
- [x] T006 [P] Test CT-112-102 and CT-112-103 (order of running and of output: severity then id, identical text on identical state; registration: 19 groups, refusal of a foreign group and of a duplicate id, read-only after launch; registering a check changes no core file) in packages/doctor/test/registry.test.ts
  - proves: F112-FR-002
- [x] T007 Implement the registry in packages/doctor/src/registry/registry.ts
  - covers: F112-FR-002; F112-FR-003
- [x] T008 [P] Test CT-112-107 (subprocess: stdin closed, 5 s limit, 64 KiB cap, ended process group, parallel probes, `probe timed out` as a warning, `--quick` skips subprocess and network checks) in packages/doctor/test/runner-bounds.test.ts
  - proves: F112-FR-007
- [x] T009 Implement the runner in packages/doctor/src/runner/run.ts
  - covers: F112-FR-007; F112-FR-008; F112-FR-003
- [x] T010 [P] Test CT-112-108 (a throwing check gives exit 1 and touches no run; an unknown severity reads as `warn`) in packages/doctor/test/runner-failure.test.ts
  - proves: F112-FR-008
- [x] T011 [P] Test CT-112-110 (a hostile project configuration: custom tags, anchors, very large file; nothing executes; size cap) in packages/doctor/test/hostile-config.test.ts
  - proves: F112-FR-010
- [x] T012 Implement the safe read of untrusted files in packages/doctor/src/probes/untrusted.ts
  - covers: F112-FR-010

## Phase 3: User Story 1 - A consumer asks whether Specstride is set up (P1)

- [x] T013 [P] [US1] Test CT-112-123 (healthy output: one line, at most 200 bytes; warnings after it; `ok` never printed) in packages/doctor/test/render-healthy.test.ts
  - proves: F112-FR-023
  - fixture: golden output of the healthy case
- [x] T014 [P] [US1] Test CT-112-124 (worst case: header, 7 lines of at most 200 bytes ordered by severity and id, footer, at most 1,700 bytes; skill body plus output within 1,500 tokens at 2.8 bytes per token; no outside text echoed) in packages/doctor/test/render-worst.test.ts
  - proves: F112-FR-024
  - fixture: golden output of the worst case
- [x] T015 [US1] Implement the text renderer in packages/doctor/src/render/text.ts
  - covers: F112-FR-023; F112-FR-024
- [x] T016 [P] [US1] Test CT-112-2 (exit codes 0, 1, 2, 3; `--strict` makes a warning exit 2; a timed-out probe never above a warning; Lisa's exit 2 on any finding is not carried) in packages/doctor/test/exit-codes.test.ts
  - proves: F112-FR-027
  - divergence: DV-041
- [x] T017 [US1] Implement the exit code table in packages/doctor/src/runner/exit.ts
  - covers: F112-FR-027
- [x] T018 [P] [US1] Test CT-112-126 (flags, among them the check-id filter `--check <id>` and the evaluation of the launch checks without launching, `--launch-checks`; `--offline`, `--online`, `doctor.online`; unknown flag, role, harness and check id give exit 3) in packages/doctor/test/flags.test.ts
  - proves: F112-FR-026
- [x] T019 [US1] Implement the flag parser in packages/doctor/src/runner/flags.ts
  - covers: F112-FR-026
- [x] T020 [P] [US1] Test CT-112-125 (`--json`: schema `specstride.doctor/1`, stable key order, no escape sequence, no secret, no account identifier, redacted evidence; `registry`, `pick`, `sources`) in packages/doctor/test/render-json.test.ts
  - proves: F112-FR-025
- [x] T021 [US1] Implement the `--json` renderer in packages/doctor/src/render/json.ts
  - covers: F112-FR-025
- [x] T022 [P] [US1] Test CT-112-129 (audience in summary; run section through the read model) in packages/doctor/test/run-section.test.ts
  - proves: F112-FR-029
- [x] T023 [US1] Implement the summary and the run section in packages/doctor/src/render/summary.ts
  - covers: F112-FR-029
- [x] T024 [P] [US1] Test CT-112-111 (env and cli checks: runtime floor, platform, platform tools as evidence of `env.os`, permissions, writable control root, protocol mismatch, differing product versions; macOS unverified) in packages/doctor/test/checks-env.test.ts
  - proves: F112-FR-011
  - divergence: DV-071
- [x] T025 [US1] Implement the checks of groups `env` and `cli` in packages/doctor/src/checks/env.ts
  - covers: F112-FR-011
- [x] T026 [P] [US1] Test CT-112-118 (config and secret checks: schema, unknown key, inline secret with at most 4 characters shown, shadowed value, widening key in project configuration, file reference inside the workspace, legacy input) in packages/doctor/test/checks-config.test.ts
  - proves: F112-FR-018
  - divergence: DV-068
- [x] T027 [US1] Implement the checks of groups `config` and `secret` in packages/doctor/src/checks/config.ts
  - covers: F112-FR-018
- [x] T028 [P] [US1] Test CT-112-116 (terms checks: refused, conditional, personal-only, unknown, allowed; stale data over 30 days; audience shown) in packages/doctor/test/checks-terms.test.ts
  - proves: F112-FR-016
  - divergence: DV-048
- [x] T029 [US1] Implement the checks of group `terms` in packages/doctor/src/checks/terms.ts
  - covers: F112-FR-016
- [x] T030 [P] [US1] Test CT-112-117 (quota and budget checks: pause state, shared window, caps, API key without a cap, automatically picked metered critic without a cap, spend not measurable) in packages/doctor/test/checks-budget.test.ts
  - proves: F112-FR-017
- [x] T031 [US1] Implement the checks of groups `quota` and `budget` in packages/doctor/src/checks/budget.ts
  - covers: F112-FR-017
- [x] T032 [P] [US1] Test CT-112-119 (run and sandbox checks: the six lock probe results, stale run, approval record that does not verify, containment level, `protection=detect`, critic path that allows all tools) in packages/doctor/test/checks-run.test.ts
  - proves: F112-FR-019
- [x] T033 [US1] Implement the checks of groups `run` and `sandbox` in packages/doctor/src/checks/run.ts
  - covers: F112-FR-019
- [x] T034 [P] [US1] Test CT-112-120 (ui, telemetry, events schema and memory checks) in packages/doctor/test/checks-misc.test.ts
  - proves: F112-FR-020
- [x] T035 [US1] Implement the checks of groups `ui`, `telemetry`, `events` and `memory` in packages/doctor/src/checks/misc.ts
  - covers: F112-FR-020
- [x] T036 [P] [US1] Test CT-112-132 (integrity invariants: a planted breach for each of the five; `info` when the log lacks the events; a refused attempt is no breach) in packages/doctor/test/gate-integrity.test.ts
  - proves: F112-FR-032
  - fixture: event logs of the test tree
- [x] T037 [US1] Implement `events.gateIntegrity` in packages/doctor/src/integrity/gate.ts
  - covers: F112-FR-032

## Phase 4: User Story 2 - The doctor and the launch agree (P1)

- [x] T038 [P] [US2] Test CT-112-130 (the launch runs the `lb` subset with the same functions; the ten flags; `budget.caps` only for an automatically picked metered critic; refusal exactly on `fail` of an `lb` check; no flag switches one off; `--launch-checks` evaluates the same subset without launching, exit 2 on an `lb` `fail`, the form a host hook calls, annex G §G.4) in packages/testkit/src/conformance/EP-14/launch-subset.test.ts
  - proves: F112-FR-030
  - fixture: the test set of launch fixtures
- [x] T039 [US2] Implement the export of the `lb` subset for `launch` and the `--launch-checks` evaluation without launching in packages/doctor/src/registry/launch-subset.ts
  - covers: F112-FR-030
- [x] T040 [P] [US2] Test CT-112-131 and CT-112-115 (critic checks: the critic-diversity warning for the results `same-model` and `unverified`, exit 0, launch not blocked; `info` for `same-provider`; `ok` for `diverse`; two models of one model tier give no finding of their own; an unknown result reads as `unverified`; independence fails on an allow-all flag; autopick shows why each candidate lost) in packages/doctor/test/diversity.test.ts
  - proves: F112-FR-031; F112-FR-015
- [x] T041 [US2] Implement the checks of group `critic` in packages/doctor/src/checks/critic.ts
  - covers: F112-FR-015; F112-FR-031
- [x] T042 [US2] Test CT-112-202 (agreement over every fixture: the launch refuses exactly when the doctor reports an `lb` fail) in packages/testkit/src/conformance/EP-14/agreement.test.ts
  - proves: F112-SC-002

## Phase 5: User Story 3 - A package adds a check without touching the core (P1)

- [x] T043 [US3] Add the cases of this feature to the conformance suite in packages/testkit/src/conformance/EP-14/ and the sample check in packages/testkit/src/samples/EP-14/ (feature 100 builds the contract-level suite and a minimal sample in the same folders)
  - covers: F112-FR-002; F112-FR-022
- [x] T044 [US3] Test CT-112-207 (the sample appears in `--json`; with `lb` it refuses a launch; removing it changes 0 core files; the import-boundary check passes) in packages/testkit/src/conformance/EP-14/ep14.test.ts
  - proves: F112-SC-007; F112-FR-002; F112-FR-022
- [x] T045 [P] [US3] Test CT-112-122 (checks registered by other features follow F112-FR-001 to F112-FR-008 and are not in the core catalogue) in packages/testkit/src/conformance/EP-14/registered.test.ts
  - proves: F112-FR-022

## Phase 6: User Story 4 - A harness without a tested adapter is shown as unverified (P2)

- [x] T046 [P] [US4] Test CT-112-113 (descriptor-only fixture: each harness named with state `unverified`; warning when selected for a role; version range; old `verified-on`) in packages/doctor/test/checks-harness.test.ts
  - proves: F112-FR-013; F112-SC-001
  - fixture: a descriptor for a fake CLI and one for a fake endpoint
- [x] T047 [US4] Implement the checks of groups `bin` and `harness` from the resolved registry in packages/doctor/src/checks/harness.ts
  - covers: F112-FR-009; F112-FR-013
- [x] T048 [P] [US4] Test CT-112-109 (no harness name in any check; per-harness entries from the registry, including a discovered one) in packages/doctor/test/no-harness-names.test.ts
  - proves: F112-FR-009
- [x] T049 [P] [US4] Test CT-112-114 (auth and model checks: present, missing, `unprobed`; tier and billing mode; loud warning for an API key; model reach; window; no account identifier) in packages/doctor/test/checks-auth.test.ts
  - proves: F112-FR-014
- [x] T050 [US4] Implement the checks of groups `auth` and `model` in packages/doctor/src/checks/auth.ts
  - covers: F112-FR-014
- [x] T051 [P] [US4] Test CT-112-121 (toolchains a run detected and which have a pattern set: the finding of a check registered from outside the package appears in text and in `--json`; the check itself is a stub of the test, the real one lives in the package of the owner of EP-16) in packages/doctor/test/toolchains.test.ts
  - proves: F112-FR-021

## Phase 7: User Story 5 - The doctor is safe to run anywhere (P2)

- [x] T052 [P] [US5] Test CT-112-104 (byte-identical workspace, control plane and user-level state before and after, on every fixture; no `--fix`; fixes printed and never run) in tests/security/112/read-only.test.ts
  - proves: F112-FR-004; F112-SC-004
- [x] T053 [P] [US5] Test CT-112-106 (file-access trace: no write, no read of a credential store, `exists` never returns a value, keychain `unprobed` on Linux) in tests/security/112/no-secret-read.test.ts
  - proves: F112-FR-006; F112-SC-004
- [x] T054 [P] [US5] Test CT-112-105 (no model call; only the allowed probes; a GET refuses redirects and goes to the declared host; no real model call for a health path) in tests/security/112/allowed-probes.test.ts
  - proves: F112-FR-005
- [x] T055 [P] [US5] Test CT-112-208 (canary secrets planted in configuration, environment and files appear in no output, text or JSON) in tests/security/112/canary.test.ts
  - proves: F112-SC-008; F112-FR-025
- [x] T056 [P] [US5] Test CT-112-112 (host checks read existence and non-secret settings only; supplied by the host package) in packages/doctor/test/checks-host.test.ts
  - proves: F112-FR-012
- [x] T057 [US5] Implement the safe probe implementations (file metadata, subprocess, GET) in packages/doctor/src/probes/real.ts
  - covers: F112-FR-004; F112-FR-005; F112-FR-006

## Phase 8: User Story 6 - The doctor is reachable on every host (P3)

- [x] T058 [P] [US6] Test CT-112-128 (one engine function; `renderEntry` for `doctor`; the host named in the output) in packages/testkit/src/conformance/EP-14/entry.test.ts
  - proves: F112-FR-028
- [x] T059 [US6] Implement the `doctor` command entry in packages/doctor/src/render/entry.ts
  - covers: F112-FR-028
- [x] T060 [US6] Test CT-112-205 (golden output check, healthy and worst case, in bytes at 2.8 bytes per token) in tests/budget/112/golden.test.ts
  - proves: F112-SC-005; F112-FR-024

## Phase 9: Polish

- [x] T061 [P] Test CT-112-206 (every one of the 45 checks has a fixture for each severity it can return) in packages/doctor/test/severity-fixtures.test.ts
  - proves: F112-SC-006
- [x] T062 [P] Test CT-112-203 and CT-112-201 (the critic-diversity warning on the same model, exit 0; descriptor-only fixture names `unverified`) in packages/testkit/src/conformance/EP-14/criteria.test.ts
  - proves: F112-SC-003; F112-SC-001
- [x] T063 [P] Test CT-112-209 (`--quick` median at most 300 ms over 30 runs; skipped on a runner without the prerequisite, with the reason) in tests/budget/112/quick.test.ts
  - proves: F112-SC-009
  - status: unverified until run on both platforms
- [x] T064 [P] Test CT-112-204 (state byte-identical before and after over all fixtures) in tests/security/112/state-identical.test.ts
  - proves: F112-SC-004
- [x] T065 Run the macOS runner over the doctor tests and mark every macOS statement verified or leave it `unverified` with the reason
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F112-FR-011; F112-FR-012; F112-FR-019
  - status: unverified until a macOS runner exists
- [x] T066 Update the docs of the package with the 19 groups, the exit codes and the flags; no path or name of the owner's machines
  - covers: F112-FR-002; F112-FR-027

## Phase 10: Repairs after the cross-feature review (2026-09-30)

- [x] T067 [P] [US3] Test CT-112-133 (place of a registered check: `packages/doctor/` holds no file of a check that another feature registers; the doctor imports no package of an owner, and a check registered through the registration call of the kernel package needs no import of the doctor; a check registered from outside, with a finding for a customisation that cannot be switched off and one for a missing terminal tool as stubs, is rendered in text and in `--json` by the rules of a core check) in packages/testkit/src/conformance/EP-14/owner-place.test.ts
  - proves: F112-FR-033
  - fixture: two stub checks of the test tree
- [x] T068 [US3] Add the rule of F112-FR-033 to the import-boundary data of the package and to the catalogue consistency check: every row of packages/doctor/data/check-catalogue.tsv whose probe is not `core` has no file in packages/doctor/src/checks/
  - covers: F112-FR-033
