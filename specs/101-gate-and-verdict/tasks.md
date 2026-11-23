# Tasks: Gate and verdict (feature 101)

**Input**: Design documents from `specs/101-gate-and-verdict/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: requested. Parity tests (`PT-101-*`) and characterization tests (`CT-101-*`) are
required tasks. Every test task names what it proves and the fixture it runs on
(`STAGE-B-RULES.md` section 4; feature 141 §O.6). Tests are written first and fail before the
code exists.

**Split**: the feature was split on 2026-09-29. The tasks of group G4 left: T034, T041, T086 to
T100 and T103. Task ids are not reused, so the sequence has gaps.

**Repair of 2026-09-30**: the tasks T108 to T114 were appended after the cross-feature review.
They stand in the phase they belong to, so the numbers are not in order inside a phase. The
analyze run of the same day moved T074 (the verification of an approval record) from user story 3
to user story 1, because T036 needs it; its id stays.

**Organization**: by user story of the spec. No spike, fixture capture or live probe is assigned
to this feature; the first tasks are the characterization of the code extracted from Lisa.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the spec (US1 to US4)
- `proves:` and `fixture:` under a test task; `criterion:` names a success criterion of the spec that the test measures; `surfaces:` where the test compares fewer than all surfaces of the family

## Path Conventions

Paths are those of plan.md: `packages/core/src/{engine,gate,approval,recovery,post-approval}/`,
`tests/{parity,characterization}/101/` and, for the own tests, `packages/core/test/101/` (the rule
of feature 100 for the place of tests, `specs/100-specstride/plan.md`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the directories of this feature inside the workspace that feature 100 creates

- [x] T001 Create the directories `engine`, `gate`, `approval`, `recovery` and `post-approval` in packages/core/src/ with an index file each, and the test directories tests/parity/101/, tests/characterization/101/ and packages/core/test/101/
- [x] T002 [P] Add the schema files of the records of data-model.md (record of a phase attempt, verdict record, recovery markers, approval key, accelerator snapshot; the archive at approval holds copies of text records and needs no schema) in packages/contracts/schemas/ and generate their types in packages/contracts/src/records/
- [x] T003 [P] Add the three new closed sets of the spec (details of a MALFORMED verdict, cases of a diagnosis, what failed in an approval record), each with its unknown-value rule, in packages/contracts/src/enums/gate.ts
- [x] T004 [P] Copy specs/101-gate-and-verdict/contracts/gate-halts.json into packages/contracts/data/ and validate at load that every stop reason and exit code in it is a member of the closed sets of feature 100, in packages/contracts/test/gate-data.test.ts
- [x] T005 [P] Register the import-boundary rule "only packages/core/src/gate/writers.ts and packages/core/src/approval/record.ts write records of the phase gate; no package of a loop layer imports them" in tools/import-boundary/rules/gate-writers.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the code extracted from Lisa, characterized before it is used, and the parts every
user story needs

**⚠️ CRITICAL**: no user story can start before this phase is done

### Characterization of the extracted code (first)

- [x] T006 Extract Lisa's nonce verdict parser and gate store as source from the Lisa baseline at `363e6a3` (read with `git show`, never written there) into packages/core/src/gate/verdict-parser.ts and packages/core/src/approval/record.ts, with the licence note, unchanged in behaviour
- [x] T007 [P] Characterization test CT-101-7 of the fresh nonce per review in tests/characterization/101/ct-101-07-nonce.test.ts
  - proves: 002 FR-018
  - fixture: none; inputs of the test tree
- [x] T008 [P] Characterization test CT-101-8 of the parser: exactly one line with the exact nonce in tests/characterization/101/ct-101-08-one-line.test.ts
  - proves: 002 FR-019
  - fixture: none; recorded replies of the test tree
- [x] T009 [P] Characterization test CT-101-10: every reply without exactly one nonce line is no approval in tests/characterization/101/ct-101-10-non-approval.test.ts
  - proves: 002 SC-001
  - fixture: none; recorded replies of the test tree
- [x] T010 [P] Characterization tests CT-101-5 and CT-101-12 of the atomic write of the files of the phase gate: a reader never sees a part of a file while the writer is ended at random moments, in tests/characterization/101/ct-101-05-12-atomic.test.ts
  - proves: 002 FR-013; 002 SC-003
  - fixture: none; a writer and a reader of the test tree
- [x] T011 Bring the extracted parser to the grammar of the baseline (whole line, anywhere in the reply, case not regarded, agreeing duplicates are MALFORMED) per specs/101-gate-and-verdict/contracts/verdict-grammar.md in packages/core/src/gate/verdict-parser.ts (F101-FR-007), and update T008 and T009 where the extracted behaviour differed, recording each difference in tests/characterization/101/README.md

- [x] T108 [P] Own property test CT-101-32 of the verdict parser: generated replies (a wrong nonce, a nonce of another call, duplicated verdict lines that agree and that differ, a partial line, a verdict line inside a longer line, upper, lower and mixed case, line ends of the three kinds, blanks around every part, a reply of no bytes, bytes that are no valid text) and the fuzz of lines in the form of a verdict placed in phase evidence, in feedback, in a ledger record and in a row of the fact block; only a reply with exactly one whole line that carries the exact nonce of the call gives a verdict, and every other input gives MALFORMED with a detail of the closed set, in packages/core/test/101/ct-101-32-verdict-parser.property.test.ts. The generator takes a seed, and the seed of a failing case is printed
  - proves: F101-FR-007; F101-FR-008
  - fixture: none; generated replies with a fixed seed

### Shared parts

- [x] T012 Implement the single writer of the records of the phase gate (temporary name, rename, through the atomic write of the kernel) in packages/core/src/gate/writers.ts (F101-FR-028)
- [x] T013 [P] Implement the nonce (8 bytes of the secure random source, 16 lower-case hexadecimal characters, held in memory only until the call returns) in packages/core/src/gate/nonce.ts (F101-FR-006)
- [x] T014 [P] Implement signature, gist and reason of a feedback in packages/core/src/gate/feedback.ts, with the hash from the canonical hasher (F101-FR-019, F101-FR-012)
- [x] T015 [P] Implement the boundaries (stop request and `verify` of the lease through the lock port) in packages/core/src/engine/boundaries.ts (F101-FR-040)
- [x] T016 Implement the terminal record and the work of the end of the run, in the order of registration, in packages/core/src/engine/terminal.ts (F101-FR-036)
- [x] T017 [P] Implement the emitters of the events of the phase gate and their rows for the compatibility projection, per the table "As-is events of the phase gate", in packages/core/src/gate/events.ts (F101-FR-038)
- [x] T018 [P] Implement the as-is lines of the phase gate for compatibility output, per the table "As-is lines of the phase gate", in packages/core/src/gate/lines.ts (F101-FR-039)

**Checkpoint**: the extracted code is characterized; records can be written; the engine can end

---

## Phase 3: User Story 1 - A phase is approved only by an independent verdict (Priority: P1) 🎯 MVP

**Goal**: a run of stub agents that approve ends with every phase approved, ticked and committed

**Independent Test**: FX-01 under the `parity` profile compares equal; on the event log every
approval follows a reply with the matching nonce after the verification gate

### Tests for User Story 1 ⚠️

- [x] T019 [P] [US1] Parity test PT-101-028FR003-start-position in tests/parity/101/pt-028fr003-start-position.test.ts
  - proves: 028 FR-003
  - fixture: FX-01, FX-13, FX-15
- [x] T020 [P] [US1] Parity test PT-101-028FR005-verdict-nonce in tests/parity/101/pt-028fr005-verdict-nonce.test.ts
  - proves: 028 FR-005
  - fixture: FX-05
- [x] T021 [P] [US1] Parity test PT-101-028FR006-approval-and-feedback in tests/parity/101/pt-028fr006-approval-and-feedback.test.ts
  - proves: 028 FR-006
  - fixture: FX-01, FX-02, FX-05
- [x] T022 [P] [US1] Parity test PT-101-028SC001-all-approved in tests/parity/101/pt-028sc001-all-approved.test.ts
  - proves: 028 SC-001
  - fixture: FX-01
  - surfaces: exit, events
- [x] T023 [P] [US1] Parity test PT-101-028SC002-no-approval-from-evidence in tests/parity/101/pt-028sc002-no-approval-from-evidence.test.ts
  - proves: 028 SC-002
  - fixture: FX-05
- [x] T024 [P] [US1] Parity test PT-101-028FR013-tick in tests/parity/101/pt-028fr013-tick.test.ts
  - proves: 028 FR-013
  - fixture: FX-01
  - surfaces: tree, events, stdout
- [x] T025 [P] [US1] Parity test PT-101-028FR014-commit in tests/parity/101/pt-028fr014-commit.test.ts
  - proves: 028 FR-014
  - fixture: FX-27
  - surfaces: repository, events, stdout
- [x] T026 [P] [US1] Parity test PT-101-C-005-run-entry in tests/parity/101/pt-c-005-run-entry.test.ts
  - proves: C-005
  - fixture: FX-01, FX-02, FX-03
- [x] T027 [P] [US1] Parity test PT-101-C-059-critic-call, PT-101-C-060-critic-inputs and PT-101-C-061-critic-settings in tests/parity/101/pt-c-059-060-061-critic-call.test.ts
  - proves: C-059; C-060; C-061
  - fixture: FX-01, FX-02, FX-03, FX-08
  - surfaces: transcript, events, state
- [x] T028 [P] [US1] Parity test PT-101-C-063-result-codes in tests/parity/101/pt-c-063-result-codes.test.ts
  - proves: C-063
  - fixture: FX-01, FX-02, FX-03, FX-05, FX-08
- [x] T029 [P] [US1] Parity test PT-101-C-064-gate-files in tests/parity/101/pt-c-064-gate-files.test.ts
  - proves: C-064
  - fixture: FX-01, FX-02, FX-03, FX-05, FX-06, FX-08
  - surfaces: state
- [x] T030 [P] [US1] Parity test PT-101-C-066-verdict-grammar in tests/parity/101/pt-c-066-verdict-grammar.test.ts
  - proves: C-066
  - fixture: FX-01, FX-02, FX-03, FX-05, FX-08, FX-21
- [x] T031 [P] [US1] Parity test PT-101-C-013-phase-loop (start phase, order at the phase gate, steps after an approval, approval commit) in tests/parity/101/pt-c-013-phase-loop.test.ts
  - proves: C-013; B-0271; B-0323
  - fixture: FX-01, FX-02, FX-13, FX-15, FX-27
- [x] T032 [P] [US1] Characterization tests CT-101-1 and CT-101-11: the run starts at the first phase without approval and no counter is stored, in tests/characterization/101/ct-101-01-11-start.test.ts
  - proves: 002 FR-008; 002 SC-002
  - fixture: FX-01, FX-13
- [x] T033 [P] [US1] Characterization test CT-101-4: what happens on an approval, in tests/characterization/101/ct-101-04-on-approval.test.ts
  - proves: 002 FR-012
  - fixture: FX-01
- [x] T035 [P] [US1] Own property test for F101-SC-002 on the event log of every fixture run: no approval record without a nonce-matched reply after the verification gate of the same phase attempt ran, or was not required by the verification mode of the fixture, which the test reads from the run set of the fixture, in packages/core/test/101/sc-002-approval-order.test.ts
  - proves: F101-FR-005; F101-FR-008
  - criterion: F101-SC-002
  - fixture: FX-01 to FX-08, FX-15, FX-27 (port side only)

### Implementation for User Story 1

- [x] T036 [US1] Implement the start position (first phase without a verified approval record; the start phase given by the consumer; every phase from there on) in packages/core/src/engine/start-position.ts (F101-FR-002)
- [x] T037 [US1] Implement the loop over phases, the path "every phase approved before" and the end of the run in packages/core/src/engine/run-loop.ts (F101-FR-001, F101-FR-003, F101-FR-018)
- [x] T038 [US1] Implement phase entry (start event and line, leftover phase evidence set aside under the as-is label) and the loop over phase attempts in packages/core/src/engine/phase.ts (F101-FR-004)
- [x] T039 [US1] Implement the order at the phase gate, with the feedback the engine writes after a failed verification gate, in packages/core/src/gate/phase-gate.ts (F101-FR-005, F101-FR-013)
- [x] T040 [US1] Implement the critic call (inputs, role and invocation identity, time limit, result record, outcomes), made through the operation `judge` of the critic strategy of feature 100 annex E §E.1 with the call function the engine hands to it, in packages/core/src/gate/critic-call.ts (F101-FR-009, F101-FR-010, F101-FR-011)
- [x] T042 [P] [US1] Implement the verdict record and the feedback of the critic in packages/core/src/gate/verdict-record.ts and packages/core/src/gate/feedback.ts (F101-FR-012)
- [x] T043 [US1] Implement the approval record (fields of `specstride.approval/1`, signature) and the approval key in packages/core/src/approval/record.ts and packages/core/src/approval/key.ts (F101-FR-029, F101-FR-030)
- [x] T074 [US1] Implement the verification of an approval record (schema, signature, verdict record, hash of the phase evidence set aside, hash of the stored result) and the integrity event in packages/core/src/approval/verify.ts (F101-FR-031); T036 reads approvals through it, and CT-101-14 (T070, user story 3) proves it
- [x] T044 [US1] Implement the order of the steps after an approval in packages/core/src/post-approval/order.ts (F101-FR-033)
- [x] T045 [P] [US1] Implement ticking through `tick` of the spec-format port in packages/core/src/post-approval/tick.ts (F101-FR-034)
- [x] T046 [P] [US1] Implement the approval commit, with the scan before the commit, through the check runner port in packages/core/src/post-approval/commit.ts (F101-FR-035)
- [x] T047 [US1] Provide the engine entry that the command `run` calls, options only, in packages/core/src/engine/index.ts (F101-FR-001)

**Checkpoint**: FX-01 and FX-27 compare equal; the MVP is a run that approves

---

## Phase 4: User Story 2 - A run that cannot converge halts and says why (Priority: P1)

**Goal**: every halt of the phase gate has one exit code and one stop reason

**Independent Test**: the table test over FX-03 to FX-07 against contracts/gate-halts.json

### Tests for User Story 2 ⚠️

- [x] T048 [P] [US2] Parity test PT-101-028FR008-reject-limit in tests/parity/101/pt-028fr008-reject-limit.test.ts
  - proves: 028 FR-008
  - fixture: FX-03
- [x] T049 [P] [US2] Parity test PT-101-028SC004-attempts-at-most-limit in tests/parity/101/pt-028sc004-attempts-at-most-limit.test.ts
  - proves: 028 SC-004
  - fixture: FX-03
  - surfaces: transcript, events
- [x] T050 [P] [US2] Parity test PT-101-028FR009-oscillation in tests/parity/101/pt-028fr009-oscillation.test.ts
  - proves: 028 FR-009
  - fixture: FX-04
- [x] T051 [P] [US2] Parity test PT-101-028FR010-malformed-limit in tests/parity/101/pt-028fr010-malformed-limit.test.ts
  - proves: 028 FR-010
  - fixture: FX-05, FX-06, FX-07
- [x] T052 [P] [US2] Parity test PT-101-028FR007-archive in tests/parity/101/pt-028fr007-archive.test.ts
  - proves: 028 FR-007
  - fixture: FX-02
  - surfaces: state, events
- [x] T053 [P] [US2] Parity test PT-101-C-009-exit-codes and PT-101-C-010-stop-reasons, as a table test over contracts/gate-halts.json, in tests/parity/101/pt-c-009-010-halts.test.ts
  - proves: C-009; C-010
  - fixture: FX-01, FX-03, FX-04, FX-05, FX-06, FX-07, FX-15; each scenario of FX-07 is mapped to its row by contracts/gate-halts.json (`FX-07/phase-not-found` to `critic-config`, the six scenarios of an error inside the call to `malformed-limit`)
  - surfaces: exit, events
- [x] T054 [P] [US2] Parity test PT-101-C-006-flags and PT-101-C-007-settings (reject limit, time limit of the critic call, start phase, MALFORMED limit, threshold of oscillation, commits, ticking) in tests/parity/101/pt-c-006-007-settings.test.ts
  - proves: C-006; C-007
  - fixture: FX-03, FX-04, FX-05, FX-08, FX-13, FX-23, FX-27
- [x] T055 [P] [US2] Parity test PT-101-C-008-events and PT-101-C-062-critic-events in tests/parity/101/pt-c-008-062-events.test.ts
  - proves: C-008; C-062
  - fixture: FX-01 to FX-08, FX-13, FX-27
  - surfaces: events
- [x] T056 [P] [US2] Parity test PT-101-C-012-lines and PT-101-C-065-critic-lines in tests/parity/101/pt-c-012-065-lines.test.ts
  - proves: C-012; C-065
  - fixture: FX-01, FX-02, FX-03, FX-05, FX-07, FX-08, FX-27
  - surfaces: stdout, stderr, state
- [x] T057 [P] [US2] Parity test PT-101-C-011-gate-state (archive, invocation record of the critic, archive at approval) in tests/parity/101/pt-c-011-gate-state.test.ts
  - proves: C-011
  - fixture: FX-01, FX-02, FX-03, FX-08
  - surfaces: state
- [x] T058 [P] [US2] Characterization test CT-101-2: halt at the reject limit, or archive and retry, in tests/characterization/101/ct-101-02-reject-limit.test.ts
  - proves: 002 FR-010
  - fixture: FX-03
- [x] T059 [P] [US2] Characterization test CT-101-3: a transport error is MALFORMED, a configuration error halts, in tests/characterization/101/ct-101-03-transport-config.test.ts
  - proves: 002 FR-011
  - fixture: FX-06, FX-07
- [x] T060 [P] [US2] Characterization test CT-101-6: the archive of a rejected phase attempt, in tests/characterization/101/ct-101-06-archive.test.ts
  - proves: 002 FR-014
  - fixture: FX-02
- [x] T061 [P] [US2] Characterization test CT-101-9: MALFORMED feedback states the rejection as the safe failure, in tests/characterization/101/ct-101-09-malformed-feedback.test.ts
  - proves: 002 FR-020
  - fixture: FX-05
- [x] T062 [P] [US2] Own test CT-101-16: every exit path of the engine leaves a terminal record that validates, with `retryable` never above the attribute of its stop reason; counts that reach the reject limit across a resume, in packages/core/test/101/ct-101-16-terminal.test.ts
  - proves: F101-FR-036; F101-FR-037; F101-FR-014
  - criterion: F101-SC-003
  - fixture: FX-03 to FX-07, FX-13 (port side only)
- [x] T063 [P] [US2] Own test CT-101-17: the owner of the lease is lost at each boundary of the phase gate; no phase gate runs, no approval record is written, exit 6, in packages/core/test/101/ct-101-17-owner-lost.test.ts
  - proves: F101-FR-040
  - fixture: FX-01 (port side only), with the sample lock provider of the test kit
- [x] T109 [P] [US2] Own test CT-101-30: with a missing credential of the critic, under the `parity` profile every phase attempt is scored MALFORMED with the detail `call-failed` and the run ends with exit 1 and `critic_unavailable` at the MALFORMED limit; outside the profile the engine halts with exit 3 and `critic_config` before the first call, no count changes, and the message names the credential and holds no value; every row of contracts/gate-halts.json that names a scenario of FX-07 ends as the row says, in packages/core/test/101/ct-101-30-missing-credential.test.ts
  - proves: F101-FR-010
  - criterion: F101-SC-003
  - fixture: FX-07/missing-key, FX-07/codex-missing-key, FX-07/phase-not-found (port side only)
- [x] T110 [P] [US2] Own test CT-101-33: a reply of the critic, a reply of the diagnostician and an error message of the harness that hold a planted canary secret reach no line of the engine log, no halt banner, no field of an event and no span with the canary; with the redactor unavailable the mark of dropped content stands in the place and the verdict and the counts are unchanged; no module of this feature redacts (a static test over its sources), in packages/core/test/101/ct-101-33-ingress.test.ts
  - proves: F101-FR-052
  - fixture: FX-02, FX-08 (port side only), with a canary in the reply of the stub critic
- [x] T064 [P] [US2] Own test CT-101-18: the paths of the phase gate that rest blocked on a human emit `blocked` with a reason of the closed set and end with the stop reason of the table; a halt by a limit is not relaunched, in packages/core/test/101/ct-101-18-blocked.test.ts
  - proves: F101-FR-041
  - fixture: FX-06, FX-07 (port side only)

### Implementation for User Story 2

- [x] T065 [US2] Implement the reject count, the MALFORMED streak and the order after a rejection, with counts read from and written to the ledger through the engine, and the call of `next` of the attempt planner of feature 100 annex E §E.1 for the kind of the next phase attempt, in packages/core/src/gate/limits.ts (F101-FR-014, F101-FR-015, F101-FR-017)
- [x] T066 [P] [US2] Implement the oscillation halt with the window keyed by the sequence of phase attempts in packages/core/src/gate/oscillation.ts (F101-FR-016)
- [x] T067 [P] [US2] Implement the archive of a phase attempt with the suffix rule in packages/core/src/gate/archive.ts (F101-FR-027)
- [x] T068 [US2] Implement the halts from contracts/gate-halts.json and the halt banner in packages/core/src/gate/halts.ts (F101-FR-037, F101-FR-014)
- [x] T069 [US2] Implement the blocked paths of the phase gate and the classification of a failed critic-class call through the quota classifier port in packages/core/src/gate/critic-call.ts (F101-FR-010, F101-FR-041)
- [x] T111 [US2] Implement the check of the credential of the critic before the call, behind the switch of F101-FR-010 (on by default, off under the `parity` profile, where the missing credential fails inside the call and is scored MALFORMED), through the operation `preflight` of the harness port, which makes no paid call; the engine reads no credential, in packages/core/src/gate/critic-call.ts (F101-FR-010)
- [x] T112 [US2] Pass the text of a critic-class call through the ingress of feature 100 before it reaches the lines, the halt banner, the fields `reason` and `error` of the events and the spans, in packages/core/src/gate/lines.ts, packages/core/src/gate/events.ts and packages/core/src/gate/halts.ts (F101-FR-052)

**Checkpoint**: FX-02 to FX-07 compare equal; the table test passes

---

## Phase 5: User Story 3 - A forged approval approves nothing (Priority: P1)

**Goal**: an approval counts only when its record verifies

**Independent Test**: CT-101-14 over the ways of forging

### Tests for User Story 3 ⚠️

- [x] T070 [P] [US3] Own test CT-101-14: a planted marker, a wrong signature, a missing record, an unknown key, a record bound to another hash of the phase evidence or of the result of the verification gate each count as not approved and raise an integrity event that names what failed, in packages/core/test/101/ct-101-14-forged-approval.test.ts
  - proves: F101-FR-031; F101-FR-011
  - criterion: F101-SC-004
  - fixture: FX-13/planted-approval-marker and FX-01 (port side only)
- [x] T071 [P] [US3] Own test CT-101-13: the approval key is not the ledger key, is in no environment of a harness call or of a check, and is named by the record, in packages/core/test/101/ct-101-13-approval-key.test.ts
  - proves: F101-FR-030
  - fixture: FX-01 (port side only); transcript of the stubs for the names of environment variables
- [x] T072 [P] [US3] Own test CT-101-15: a specification with a phase whose tasks are all ticked and no approval record refuses the start with exit 3 and names the three state commands; under the `parity` profile the refusal is off, in packages/core/test/101/ct-101-15-ticked-without-record.test.ts
  - proves: F101-FR-032
  - fixture: none; a workspace of the test tree
- [x] T073 [P] [US3] Parity test PT-101-028FR003-approval-existence: the existence of an approval compares through the logical name `gate:<N>:approved`, with the waiver of DV-029 for content and for the planted marker, in tests/parity/101/pt-028fr003-approval-existence.test.ts
  - proves: 028 FR-003; B-0271; B-0875
  - fixture: FX-01, FX-13
  - surfaces: state

### Implementation for User Story 3

- [x] T075 [US3] Use the verification of T074 (user story 1) wherever the engine reads an approval: start position, resume, relaunch, phase entry, in packages/core/src/engine/start-position.ts and packages/core/src/engine/phase.ts (F101-FR-002, F101-FR-031)
- [x] T076 [P] [US3] Implement the refusal for ticked phases without an approval record in packages/core/src/approval/ticked-without-record.ts (F101-FR-032)

**Checkpoint**: no forged approval is accepted

---

## Phase 6: User Story 4 - A stuck phase gets one diagnosis and one accelerated phase attempt (Priority: P2)

**Goal**: the recovery cycle as at the baseline

**Independent Test**: FX-08 under the `parity` profile

### Tests for User Story 4 ⚠️

- [x] T077 [P] [US4] Parity test PT-101-028FR011-diagnostician in tests/parity/101/pt-028fr011-diagnostician.test.ts
  - proves: 028 FR-011
  - fixture: FX-08
- [x] T078 [P] [US4] Parity test PT-101-028FR012-accelerator-due in tests/parity/101/pt-028fr012-accelerator-due.test.ts
  - proves: 028 FR-012
  - fixture: FX-08
- [x] T079 [P] [US4] Parity test PT-101-028SC005-one-per-signature in tests/parity/101/pt-028sc005-one-per-signature.test.ts
  - proves: 028 SC-005
  - fixture: FX-08
  - surfaces: transcript, events
- [x] T080 [P] [US4] Parity test PT-101-C-013-recovery (signature, gist, due rules, prompt of the accelerator, order after a rejection) in tests/parity/101/pt-c-013-recovery.test.ts
  - proves: C-013
  - fixture: FX-03, FX-04, FX-05, FX-08
- [x] T081 [P] [US4] Parity test PT-101-C-066-diagnostician (prompt, caps, case, no nonce) in tests/parity/101/pt-c-066-diagnostician.test.ts
  - proves: C-066
  - fixture: FX-08
  - surfaces: transcript, state, events
- [x] T113 [P] [US4] Own test CT-101-31: the diagnostician runs in the form of the `completion` level of its entry of the role plan and records the proof; a proof that fails gives a warning, no call and no hint; for the form `read-only-tools` the proposer's notebook, handoff and outbox are out of the working tree during the call and back, unchanged, after it, however the call ends; the critic-diversity warning is raised and recorded for the results `same-model` and `unverified` and never blocks the call; under the `parity` profile no proof is made and the line of the warning is not printed, in packages/core/test/101/ct-101-31-diagnostician-form.test.ts
  - proves: F101-FR-020
  - fixture: FX-08 (port side only), with the sample harness of the test kit in both forms
- [x] T082 [P] [US4] Own test CT-101-29: outside the `parity` profile the prompts of the diagnostician and of an accelerated phase attempt hold outside text inside data boundaries; with the as-is block sets they equal the baseline's, in packages/core/test/101/ct-101-29-recovery-prompts.test.ts
  - proves: F101-FR-022; F101-FR-025
  - fixture: FX-08 (port side only)
  - surfaces: transcript

### Implementation for User Story 4

- [x] T083 [US4] Implement the recovery markers in packages/core/src/recovery/markers.ts (F101-FR-021, F101-FR-024)
- [x] T084 [US4] Implement the diagnostician: the call as a critic-class call in the form of the `completion` level of its entry of the role plan, with the proof recorded, the hiding of the proposer's files for the form `read-only-tools` through the port that feature 100 annex C §C.3 names, and the critic-diversity test before the call; the prompt with its caps and markers, the case, the hint, in packages/core/src/recovery/diagnostician.ts (F101-FR-020, F101-FR-021, F101-FR-022, F101-FR-023)
- [x] T085 [US4] Implement the accelerator: the due rule, the prompt blocks through the prompt block provider, the state of the tree before and after, the acceleration note, and the two facts of the history that the engine hands to the attempt planner (a diagnosis was made; an accelerated phase attempt is due), in packages/core/src/recovery/accelerator.ts (F101-FR-024, F101-FR-025, F101-FR-026)

**Checkpoint**: FX-08 compares equal

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: what spans the user stories

- [x] T101 [P] Own test for F101-SC-009: ending the engine at random moments while it writes leaves no partial file under the logical names of this feature, in packages/core/test/101/sc-009-no-partial-file.test.ts
  - proves: F101-FR-028
  - criterion: F101-SC-009
  - fixture: FX-02 (port side only)
- [x] T102 [P] Own test for F101-SC-008: no phase gets more judged phase attempts than the reject limit in one count, and no signature more than one diagnosis and one accelerated phase attempt, in packages/core/test/101/sc-008-limits.test.ts
  - proves: F101-FR-014; F101-FR-021; F101-FR-024
  - criterion: F101-SC-008
  - fixture: FX-03, FX-08 (port side only)
  - surfaces: transcript, counters
- [x] T104 [P] Add the rows of this feature to the test of the `parity` profile (row 129 for the refusal of F101-FR-032; row 133 for the switch of a missing credential of F101-FR-010) in packages/contracts/test/profile.test.ts
- [x] T105 [P] Run the static vocabulary review of the test kit over specs/101-gate-and-verdict/ and the sources of this feature: no bare term, no harness name in control flow, no physical path of state
- [x] T106 Run quickstart.md from section 1 to section 5 and record the results in packages/core/test/101/README.md
- [x] T114 Run the parity tests, the characterization tests and the own tests of this feature on the macOS runner when it exists, and record the result per test in tests/parity/101/README.md; until then every statement about macOS of this feature stays `unverified` (the `status:` line of F101-FR-030 and the target platform of plan.md). A test whose prerequisite is missing (the reference tree, the oracle of feature 141, a macOS runner, a harness with containment C2 or above for CT-101-13) reports a skip with its reason and never a pass
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F101-FR-030; F101-SC-005
- [x] T107 Parity run for F101-SC-005: every `PT-101-*` test on the live differential run of feature 141, with the result per family recorded in tests/parity/101/README.md
  - proves: C-005; C-006; C-007; C-008; C-009; C-010; C-011; C-012; C-013; C-059; C-060; C-061; C-062; C-063; C-064; C-065; C-066
  - fixture: FX-01, FX-02, FX-03, FX-04, FX-05, FX-06, FX-07, FX-08, FX-13, FX-15, FX-21, FX-23, FX-27

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends on | Blocks |
|---|---|---|
| 1 Setup | The workspace of feature 100 | Everything |
| 2 Foundational | Phase 1. T006 comes first; T007 to T010 and T108 before T011 | Every user story |
| 3 US1 | Phase 2 | US2 to US4 |
| 4 US2 | US1 (the phase gate gives the rejections) | US4 |
| 5 US3 | US1 (the approval record and its verification, T043 and T074) | — |
| 6 US4 | US2 (rejections, archive) | — |
| 7 Polish | Every user story it tests | — |

Outside this feature, through interface contracts of feature 100: the critic strategy and the
attempt planner (annex E §E.1), the pass loop and the ledger
(annex D, annex B §B.13), the spec-format port (annex C §C.7), the check runner and the result of
the verification gate (annex C §C.8), the harness port and the role plan (annex C §C.1, §C.6), the
assembler of the critic prompt (annex D §D.5, §D.7), the lock port (annex F §F.5), the event
envelope and the compatibility projection (annex X §X.1). Until they exist, the tests of this
feature use the samples of the test kit.

### Within Each User Story

- Tests first; they fail before the code exists
- Records before the code that writes them
- The phase gate before the limits; the limits before the recovery cycle
- A checkpoint closes every story

### Parallel Opportunities

- T002 to T005 together
- T007 to T010 and T108 together, after T006
- T013, T014, T015, T017, T018 together
- Every test task of one story together: each has a file of its own
- US3 beside US2, once US1 is done

## Parallel Example: User Story 1

```text
Together, before any code of the story:
T019 PT-101-028FR003-start-position     T024 PT-101-028FR013-tick
T020 PT-101-028FR005-verdict-nonce      T025 PT-101-028FR014-commit
T021 PT-101-028FR006-approval-and-feedback
T022 PT-101-028SC001-all-approved
T023 PT-101-028SC002-no-approval-from-evidence

Then, in order: T043 → T074 → T036 → T037 → T038 → T039 → T040 → T044 → T047
Beside them:    T042, T045, T046
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 and Phase 2, with the characterization of the extracted code first
2. Phase 3: a run that approves, with the signed approval record
3. Stop and validate: FX-01 and FX-27 compare equal; F101-SC-002 holds

### Incremental Delivery

| Step | Adds | Proof |
|---|---|---|
| US1 | Approval by an independent verdict | FX-01, FX-27 |
| US2 | Halts | FX-02 to FX-07; the table test |
| US3 | Forged approvals refused | CT-101-13 to CT-101-15 |
| US4 | Recovery cycle | FX-08 |
| Polish | No partial file; the limits; the full parity run | T101, T102, T107 |

## Coverage of tests

| Test | Task | Test | Task |
|---|---|---|---|
| CT-101-1, CT-101-11 | T032 | CT-101-10 | T009 |
| CT-101-2 | T058 | CT-101-13 | T071 |
| CT-101-3 | T059 | CT-101-14 | T070 |
| CT-101-4 | T033 | CT-101-15 | T072 |
| CT-101-5, CT-101-12 | T010 | CT-101-16 | T062 |
| CT-101-6 | T060 | CT-101-17 | T063 |
| CT-101-7 | T007 | CT-101-18 | T064 |
| CT-101-8 | T008 | CT-101-29 | T082 |
| CT-101-9 | T061 | CT-101-30 | T109 |
| CT-101-31 | T113 | CT-101-32 | T108 |
| CT-101-33 | T110 | | |

CT-101-19 to CT-101-28 left with the split.

## Notes

- A test may claim a behaviour item only if its fixture executed the evidence line of the item on the reference (feature 141, §O.1 rule 6). Where the exercise map shows that a family does not reach an item, the test names another family or the item becomes a characterization test, by a correction of the traceability files that is reported, not made here
- A scenario that a test needs and the first set of feature 141 lacks is added inside the scope of its family, with the stub verbs and surfaces of feature 141 only (§O.1 rule 4)
- "Port side only" marks an own test that uses the stubs and fixtures of the oracle without the reference; it is never counted as a parity test
- No task calls a paid API
