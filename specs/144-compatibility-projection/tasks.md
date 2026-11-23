---
description: "Task list of feature 144-compatibility-projection"
---

# Tasks: Compatibility projection (feature 144)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. A test task is written before the task it tests and must fail before that task is done. There is no spike, capture or paid probe.

## Phase 1: Setup

- [x] T001 Create the directory of the projection, packages/observability/src/projection/, in the package `@specstride/observability` (layer L1, owners 111, 128 and 144 in the package graph of feature 100; it may import `@specstride/contracts` and `@specstride/kernel`); where the package does not exist yet, create it with `package.json` (no install script), `tsconfig.json` and a test script
  - covers: F144-FR-001
- [x] T002 Copy contracts/projection-table.tsv into packages/observability/data/projection/ and add the check of `contracts/README.md` to the build in packages/observability/test/projection/table-consistency.test.ts; the check reads the types from the copy of the event catalogue in packages/observability/data/ (the one source of the type names, F144-FR-002) and never from `specs/`
  - covers: F144-FR-002

## Phase 2: User Story 1 - The oracle compares the old vocabulary (P1)

- [x] T003 [P] [US1] Test CT-144-101 and CT-144-102 (on under `parity` and `compat.legacyEvents`, off otherwise; every type has a row; 65 old names are targets) in packages/observability/test/projection/onoff-coverage.test.ts
  - proves: F144-FR-001; F144-FR-002
  - measures: F144-SC-002
- [x] T004 [P] [US1] Parity test PT-144-C-022-bash-line (key order, ambient fields, all values strings, escaping, trailing key dropped, `ts` fallback) in tests/parity/144/bash-line.test.ts
  - proves: C-022; B-0361; B-0362; B-0363; B-2465; B-2466
  - fixture: FX-01, FX-26
  - surfaces: events
- [x] T005 [P] [US1] Parity test PT-144-C-066-critic-line (typed values, null dropped, `ts` six decimals, `time` form, best effort; the shape `learning`: `event` first, then `ts`, no `time`) in tests/parity/144/critic-line.test.ts
  - proves: C-066; B-0997; B-0998
  - fixture: FX-01, FX-26
  - surfaces: events
- [x] T006 [P] [US1] Parity test PT-144-C-013-quirks (duplicate `feature` and `backend`, string typing, ordered pairs) in tests/parity/144/quirks.test.ts
  - proves: C-013; B-2463; B-2464
  - fixture: FX-01, FX-26
  - surfaces: events
- [x] T007 [P] [US1] Parity test PT-144-C-013-run-stop (one halt path, event then rail, two `run_stop` lines, `iter` tells them apart) in tests/parity/144/run-stop.test.ts
  - proves: C-013; B-0263
  - fixture: FX-01, FX-26
  - surfaces: events, stdout, state
- [x] T008 [P] [US1] Parity tests PT-144-C-007-ambient-fields (label, task, event context names in the transcript, `SPECSTRIDE_SHIP` included), PT-144-C-052-run-id-form (the run id a component generates for itself) and PT-144-C-061-events-destination (the file the critic's lines go to) in tests/parity/144/ambient.test.ts
  - proves: C-007; C-052; C-061; B-0062; B-0064; B-0066; B-0500; B-0850
  - fixture: FX-01, FX-26
  - surfaces: events, transcript
- [x] T009 [P] [US1] Parity test PT-144-C-011-legacy-file (event file and engine log created empty at start, one of each for each engine start, absent with the projection off; the learning lines of the `learn` command in the learning legacy file) in tests/parity/144/legacy-file.test.ts
  - proves: B-0166
  - fixture: FX-01, FX-26
  - surfaces: events, state
- [x] T010 [P] [US1] Parity test PT-144-events-all-families (the surface `events` on every family FX-01 to FX-40 that names it, through N-12, N-13, N-14) in tests/parity/144/families.test.ts
  - proves: C-007; C-013; C-022; C-052; C-061; C-066; B-0166
  - measures: F144-SC-001
  - fixture: FX-01, FX-02, FX-03, FX-04, FX-05, FX-06, FX-07, FX-08, FX-11, FX-12, FX-13, FX-14, FX-15, FX-16, FX-17, FX-18, FX-19, FX-20, FX-21, FX-22, FX-23, FX-24, FX-25, FX-26, FX-27, FX-29, FX-35, FX-36, FX-38, FX-39
  - surfaces: events
- [x] T011 [US1] Implement the table reader and the three line shapes in packages/observability/src/projection/table/ and packages/observability/src/projection/{bash-line,python-line,learning-line}/; a field map names the as-is keys a row writes, and where a row of the copied table names a field of the catalogue type that the baseline line lacks (on 2026-09-30 the rows `tool.call` and `pass.halted`), the check of T002 fails (F144-FR-009); the rows `tool.call` and `pass.halted` name the keys of the baseline lines since 2026-09-30
  - covers: F144-FR-002; F144-FR-003; F144-FR-004; F144-FR-005
- [x] T012 [US1] Implement the projection sink, its files, the ambient fields, the event context and the halt path in packages/observability/src/projection/index.ts
  - covers: F144-FR-001; F144-FR-006; F144-FR-007; F144-FR-008
- [x] T013 [P] [US1] Test CT-144-109 (rows that project to nothing; no new line under `parity`; the fields `seq`, `passId`, `category` and `strategy` in no projected line; the thirteen types of F144-FR-012 included) in packages/observability/test/projection/nothing.test.ts
  - proves: F144-FR-009; F144-FR-012
- [x] T014 [US1] Implement the rows that project to nothing and the field filter in packages/observability/src/projection/table/nothing.ts
  - covers: F144-FR-009; F144-FR-012
- [x] T015 [P] [US1] Test CT-144-110 (the four pipeline files and `[MOL-RELAUNCH]` under `relaunch.owner: root`) in packages/observability/test/projection/pipeline-files.test.ts
  - proves: F144-FR-010
- [x] T016 [US1] Implement the pipeline files in packages/observability/src/projection/pipeline-files/
  - covers: F144-FR-010
- [x] T017 [P] [US1] Characterization test CT-144-1 (Lisa: one emit, two encodings; best effort; published mapping; consistency check; projected lines in the order of `seq` inside each writer class) in tests/characterization/144/lisa-pattern.test.ts
  - proves: 002 FR-023
- [x] T018 [US1] Implement the published mapping as data with its checks and the order by writer class in packages/observability/src/projection/table/mapping.ts
  - covers: F144-FR-002; F144-FR-011

## Phase 3: Polish

- [x] T019 Conformance run of EP-08 on the projection with the sample events in tests/conformance/eventsink/projection.test.ts
  - covers: F144-FR-001
- [x] T020 Run `quickstart.md` on the fixtures and record the result in the report of the build
  - covers: F144-FR-001
- [x] T021 Run the parity suite of this feature on a macOS runner; where no macOS runner exists, record the skip with its reason in the report of the build (ruling 67: every statement about macOS is `unverified`)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F144-FR-001
- [x] T022 [P] Test CT-144-112 (the thirteen types the catalogue gained after the split each have a row that projects to nothing; no row names a type that is not in the catalogue) in packages/observability/test/projection/late-types.test.ts
  - proves: F144-FR-012
  - measures: F144-SC-002

## Dependencies

T001 before T002: the package must exist before the table and its check are added. T003 to T010 before T011 and T012. T013 and T022 before T014: T022 sits in Phase 3 by its number and is written before the task it tests. T015 before T016, and T017 before T018. T019 to T021 after T018. No task calls a model; none is paid.
