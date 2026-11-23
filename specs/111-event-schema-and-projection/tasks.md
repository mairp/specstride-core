---
description: "Task list of feature 111-event-schema-and-projection"
---

# Tasks: Event schema (feature 111)

**Input**: Design documents from `specs/111-event-schema-and-projection/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks. A test task is written before the task it tests and must fail before that task is done.

**Format**: `[ID] [P?] [Story] Description`. A test task carries `proves:`; a parity test also `fixture:` and `surfaces:`. An implementation task carries `covers:`.

**Stories**: US1 one stream (schema and writer); US2 a failing sink; US3 no secret reaches a sink; US4 additive evolution. The compatibility projection is feature 144.

**Inherited work**: none is a spike, a capture or a paid probe. The canary test is a release condition (T047). Feature 141 supplies fixtures; this feature adds no family.

**Retired ids**: the split of 2026-09-29 moved the tasks of group G5, T048 to T064, to feature 144; the ids are retired and never reused, as the ids of the requirements were (see spec.md, "Requirements moved to 144-compatibility-projection"). T071 and T072 are the tombstones of F111-FR-052 (second pass, item C8).

## Phase 1: Setup

- [x] T001 Create the package `@specstride/observability` in packages/observability/ with `package.json` (no install script), `tsconfig.json` and a test script, and the folder packages/kernel/src/redactor/ in the package `@specstride/kernel`; neither imports a core package, and no core package imports `node:fs` to reach them (F100-FR-012, CQ-185)
  - covers: F111-FR-017
- [x] T002 [P] Copy `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv` into packages/observability/data/ and add the consistency check of `contracts/README.md` to the build in packages/observability/test/data-consistency.test.ts
  - covers: F111-FR-001

## Phase 2: Foundational

- [x] T003 Test CT-111-101 (catalogue: name form, a schema for every type, `x.` free, additive change) in packages/observability/test/catalogue.test.ts
  - proves: F111-FR-001
- [x] T004 Implement the catalogue and the `data` schemas as data in packages/observability/src/catalogue/index.ts
  - covers: F111-FR-001; F111-FR-015
- [x] T005 [P] Test CT-111-120 (validation before write; an invalid event and an event without a catalogue type are not written and are counted with the reason `invalid`; the `data` of an `x.` type is not checked; never throws) in packages/observability/test/validate.test.ts
  - proves: F111-FR-020
- [x] T006 Implement validation in packages/observability/src/writer/validate.ts
  - covers: F111-FR-020

## Phase 3: User Story 1 - One stream tells the whole run (P1)

- [x] T007 [P] [US1] Test CT-111-117 (one writer; `seq` under the append lock; primary before sinks; contention with two candidate writers) in packages/observability/test/writer-lock.test.ts
  - proves: F111-FR-017
- [x] T008 [US1] Implement the primary writer in packages/observability/src/writer/writer.ts
  - covers: F111-FR-017
- [x] T009 [P] [US1] Test CT-111-118 (gapless `seq`; continuation after a crash and after a relaunch; torn last line; new line after a torn line) in packages/observability/test/seq.test.ts
  - proves: F111-FR-018
  - measures: F111-SC-007
- [x] T010 [US1] Implement `seq` continuation and the reader that tolerates a torn line in packages/observability/src/writer/seq.ts
  - covers: F111-FR-018
- [x] T011 [P] [US1] Characterization test PT-111-C-020-best-effort (a failed write is ignored; an empty destination writes nothing; `event.dropped` follows; no `seq` used) in packages/observability/test/best-effort.test.ts
  - proves: C-020; B-0352
  - fixture: FX-01, FX-26
  - surfaces: events
- [x] T012 [US1] Implement best effort and `event.dropped` in packages/observability/src/writer/besteffort.ts
  - covers: F111-FR-019
- [x] T013 [P] [US1] Test CT-111-121 (a gap, a repeat or a fall of `seq` is reported; the run goes on; doctor finding) in packages/observability/test/tamper.test.ts
  - proves: F111-FR-021
- [x] T014 [US1] Implement the tamper check as a reader operation in packages/observability/src/writer/check.ts
  - covers: F111-FR-021
- [x] T015 [P] [US1] Test CT-111-122 (learning has its own file, `seq` and lock) in packages/observability/test/learning-domain.test.ts
  - proves: F111-FR-022
- [x] T016 [US1] Implement the learning writer domain in packages/observability/src/writer/learning.ts
  - covers: F111-FR-022
- [x] T017 [P] [US1] Test CT-111-102 and CT-111-103 (envelope typed, null and absence, `strategy`, `project`; ids stable across relaunch and yield resume) in packages/observability/test/envelope-ids.test.ts
  - proves: F111-FR-002; F111-FR-003
- [x] T018 [US1] Implement the emit helpers that fill the envelope and the ids in packages/observability/src/writer/emit.ts
  - covers: F111-FR-002; F111-FR-003
- [x] T019 [P] [US1] Test CT-111-104 and CT-111-105 (every opener has its closer; synthesized closers innermost first; every engine start ends on record; `endCause` of `run.ended` from row 5 when written by the engine start and from row 96 when synthesized; no heartbeat) in packages/observability/test/pairs-terminal.test.ts
  - proves: F111-FR-004; F111-FR-005
  - measures: F111-SC-002
- [x] T020 [US1] Implement the pair table and the synthesis of closers by the next writer in packages/observability/src/writer/pairs.ts
  - covers: F111-FR-004; F111-FR-005
- [x] T021 [P] [US1] Test CT-111-106 (usage per call; increments; killed pass; subscription notional) in packages/observability/test/usage.test.ts
  - proves: F111-FR-006
- [x] T022 [P] [US1] Test CT-111-107 and CT-111-108 (pass, tool, prompt, check, job, resource, unit events; no text; `endCause` of `pass.ended` a member of its closed set; `argsRef`, `resultRef` and the four marks on `tool.call`; the result of `microloop.unit` a member of `kept`, `repair`, `unresolved`) in packages/observability/test/pass-check-events.test.ts
  - proves: F111-FR-007; F111-FR-008
- [x] T023 [P] [US1] Test CT-111-109, CT-111-110 and CT-111-111 (blocked and its changed source; `by` of `unblocked`; attempts, tasks, counters; `endCause` of `attempt.ended` and `outcome` of `phase.ended` members of their closed sets; critic form and nonce hash; `diversity` and `sameModelWarning` on `critic.selected` and on `critic.call`, true only for `same-model` and `unverified`) in packages/observability/test/blocked-attempt-critic.test.ts
  - proves: F111-FR-009; F111-FR-010; F111-FR-011
- [x] T024 [P] [US1] Test CT-111-112, CT-111-113, CT-111-114 and CT-111-115 (route decisions, model-tier bump and skips, quota and alerts add no count, stream truth, `parallel.*` on the main line with `taskId`, `step` and `pathCount`) in packages/observability/test/rulings-quota-stream-parallel.test.ts
  - proves: F111-FR-012; F111-FR-013; F111-FR-014; F111-FR-015
- [x] T025 [US1] Write the `data` schemas of the types of F111-FR-006 to F111-FR-015 in packages/observability/src/catalogue/types/
  - covers: F111-FR-006; F111-FR-007; F111-FR-008; F111-FR-009; F111-FR-010; F111-FR-011; F111-FR-012; F111-FR-013; F111-FR-014; F111-FR-015
- [x] T026 [P] [US1] Test CT-111-116 (no content in any event; every field that the catalogue marks as free text is redacted and capped by its class; no field of free text is without a mark) in packages/observability/test/no-content.test.ts
  - proves: F111-FR-016
- [x] T027 [US1] Enforce references and caps for free-text fields in packages/observability/src/writer/freetext.ts
  - covers: F111-FR-016
- [x] T028 [US1] Fixture test of the twenty gaps: one named fixture produces an event for each of EV-01 to EV-20 (F111-SC-001) in tests/parity/111/gaps.test.ts
  - proves: F111-SC-001
  - measures: F111-SC-001

## Phase 4: User Story 2 - A failing sink never breaks the loop (P1)

- [x] T029 [P] [US2] Test CT-111-134 (order, redacted event, declared majors, refusal outside range) in packages/observability/test/sink-contract.test.ts
  - proves: F111-FR-034
- [x] T030 [US2] Implement the dispatcher, the registry check and the content accessor hook in packages/observability/src/dispatcher/dispatcher.ts
  - covers: F111-FR-034
- [x] T031 [P] [US2] Conformance test CT-111-135 and CT-111-136 (slow, throwing and dead sinks leave exit code and event file unchanged; `telemetry.delivery` stays local; the sample in-memory sink) in packages/testkit/src/conformance/EP-08/suite.test.ts
  - proves: F111-FR-035; F111-FR-036
  - measures: F111-SC-003
- [x] T032 [US2] Implement time limit, bounded queue and `telemetry.delivery` in packages/observability/src/dispatcher/isolation.ts
  - covers: F111-FR-035
- [x] T033 [US2] Write the sample sink in packages/testkit/src/samples/EP-08/sample-sink.ts; the build fails if a core file names it
  - covers: F111-FR-036
- [x] T034 [P] [US2] Test CT-111-137 and CT-111-138 (unknown fields and types ignored; `x.` never projected; range warning; roles from the registry) in packages/observability/test/unknown-values.test.ts
  - proves: F111-FR-037; F111-FR-038
- [x] T035 [US2] Implement the unknown-value rules and the role handling in packages/observability/src/dispatcher/unknown.ts
  - covers: F111-FR-037; F111-FR-038

## Phase 5: User Story 3 - No secret reaches a sink (P1)

- [x] T036 [P] [US3] Parity test PT-111-C-167-redaction-rules (the four value patterns, the key names, the placeholder, the dropped thinking keys) in packages/kernel/test/redactor/redaction-rules.test.ts
  - proves: C-167; B-2203; B-2204; B-2205; B-2206; B-2207; B-2208; B-2209
  - fixture: FX-01, FX-26
  - surfaces: events, transcript
- [x] T037 [P] [US3] Parity test PT-111-C-167-target-extraction (path keys, command keys, lexical extraction, eight targets, argument summary) in packages/observability/test/targets.test.ts
  - proves: C-167; B-2210; B-2211; B-2217; B-2218
  - fixture: FX-26
  - surfaces: events
- [x] T038 [P] [US3] Parity test PT-111-C-167-limits (defaults, refusal of a bad limit, UTF-8 truncation without marker, redact before cut, metadata fields) in packages/observability/test/limits.test.ts
  - proves: C-167; B-2212; B-2213; B-2214; B-2215; B-2216
  - fixture: FX-26
  - surfaces: events
- [x] T039 [P] [US3] Parity test PT-111-C-167-retention (version string, defaults, refusals with their messages, metadata, decision function) in packages/observability/test/retention.test.ts
  - proves: C-167; B-2219; B-2220; B-2221; B-2222; B-2223
  - fixture: FX-01
  - surfaces: state
- [x] T040 [US3] Implement the ingress, the redactor with the baseline rules, the targets, the limits and the retention policy in packages/observability/src/ingress/ and packages/kernel/src/redactor/
  - covers: F111-FR-023; F111-FR-025; F111-FR-026; F111-FR-027; F111-FR-028
- [x] T041 [P] [US3] Test CT-111-123, CT-111-124 and CT-111-129 (one ingress; fail closed with a mark; widened set contains the baseline; no fixture text matches a widened-only pattern; version in the run record) in packages/observability/test/ingress-failclosed.test.ts
  - proves: F111-FR-023; F111-FR-024; F111-FR-029
- [x] T042 [US3] Write the widened pattern set as versioned data and its loader in packages/kernel/data/patterns/ and packages/kernel/src/redactor/patterns.ts
  - covers: F111-FR-024; F111-FR-029
- [x] T043 [P] [US3] Test CT-111-130 and CT-111-131 (registration at use; exact match; comment redacted; commit scan blocks and raises `redaction.commit_blocked`) in packages/kernel/test/redactor/secrets-commit.test.ts
  - proves: F111-FR-030; F111-FR-031
- [x] T044 [US3] Implement registration and the commit scan in packages/kernel/src/redactor/register.ts and packages/kernel/src/redactor/scan.ts
  - covers: F111-FR-030; F111-FR-031
- [x] T045 [P] [US3] Test CT-111-132 (content follows traces; switch off; references in the primary file; the accessor returns nothing when the redactor cannot run) in packages/observability/test/content-accessor.test.ts
  - proves: F111-FR-032
- [x] T046 [US3] Implement the content accessor in packages/observability/src/accessor/accessor.ts
  - covers: F111-FR-032
- [x] T047 [US3] Security test CT-111-133, the canary test: canaries of every class in seven places, capture on and off, every sink searched; a release condition, in tests/security/111/canary.test.ts
  - proves: F111-FR-033
  - measures: F111-SC-004; F111-SC-008

## Phase 6: Polish

- [x] T065 Read the limits, the retention and the sink time limit from rows 44, 45 and 46 of the parity profile (annex X §X.7), and add the test that the profile holds them in tests/parity/111/profile.test.ts
  - covers: F111-FR-027; F111-FR-028; F111-FR-035
- [x] T066 Run `quickstart.md` end to end on the fixtures and record the result in the report of the build
  - covers: F111-FR-017

## Phase 7: Repairs after the cross-feature review (2026-09-30)

- [x] T067 [P] [US1] Test CT-111-150 (the ten types of the micro-loop layer and of the check runner validate with the fields of the table "Types added on 2026-09-30"; a reason outside its closed set is refused; no output of a command and no note of a checkpoint; each projects to nothing) in packages/observability/test/layer-check-types.test.ts
  - proves: F111-FR-050
- [x] T068 [US1] Write the `data` schemas of the ten types of F111-FR-050 in packages/observability/src/catalogue/types/
  - covers: F111-FR-050
- [x] T069 [P] [US1] Test CT-111-151 (`source.change_accepted` one event for each file, with no text of the source; `fallback.skipped` with a reason of its set; `terms.override_used`; each projects to nothing) in packages/observability/test/control-fallback-terms-types.test.ts
  - proves: F111-FR-051
- [x] T070 [US1] Write the `data` schemas of the three types of F111-FR-051 in packages/observability/src/catalogue/types/
  - covers: F111-FR-051
- [x] T071 [P] [US1] Retired on 2026-09-30 (second pass, item C8): the test CT-111-152 and the two types `critic.passed_over` and `critic.diversity` are gone with F111-FR-052; the id is retired, never reused
- [x] T072 [US1] Retired on 2026-09-30 (second pass, item C8): see T071; the facts ride `critic.selected` and `critic.call` (F111-FR-011)
- [x] T073 [US1] Write the closed sets of `endCause` (pass, phase attempt, run) and of `outcome` (phase) as data, rename the `data` field `cause` to `endCause`, and make the build fail when a `data` schema has a field named `cause`, in packages/observability/src/catalogue/end-causes.ts
  - covers: F111-FR-005; F111-FR-007; F111-FR-010
- [x] T074 [US1] Read the column `free_text_fields` of the catalogue in the enforcement of T027, and extend the consistency check of T002: every partner is a type, every type is in `spec.md`, every marked field is a field of its type, in packages/observability/test/data-consistency.test.ts
  - covers: F111-FR-016; F111-FR-001
- [x] T075 Run the tests of the feature on the macOS runner when it exists and record the result; until then every macOS statement stays `unverified`; a test whose prerequisite is missing (the fixtures of the oracle, a macOS runner, a collector) reports a skip with its reason
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F111-FR-018; F111-FR-035

## Phase 8: After the analyze run (2026-09-30)

- [x] T076 [P] Extend the consistency check of T002 and T074: every requirement of `spec.md` (F111-FR-001 to F111-FR-038, F111-FR-050, F111-FR-051) names its test in `test:`, and every test id named there has a task that carries it in `proves:`; the retired ids (F111-FR-039 to F111-FR-049, F111-FR-052, CT-111-139 to CT-111-149, CT-111-152) and the tests that moved to 144 are not required; the share of EV-01 to EV-20 is T028's, in packages/observability/test/data-consistency.test.ts
  - proves: F111-SC-009
  - measures: F111-SC-009

## Dependencies

Phase 2 before all. T007 to T028 (US1) before T029 (the dispatcher needs the writer). T040 to T046 (ingress) before T047 (canary). T004 before T068, T070 and T073; T067 and T069 before the task each tests; T076 after T074, whose check file it extends. No task calls a model; none is paid.
