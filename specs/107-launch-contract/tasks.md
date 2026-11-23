# Tasks: Launch contract

**Input**: `specs/107-launch-contract/` (spec.md, plan.md, research.md, data-model.md, contracts/commands.md)

**Tests**: Requested. Parity tests and characterization tests are required tasks.

**Format**: `[ID] [P?] [Story] Description`. A test task names what it proves.

Task ids are never renumbered. T046 and T051 moved to the foundation, because user story 3 needs `launch` (second analyze run, 2026-09-30); T065, T066 and T067 are new. Paths: the code is in `packages/pipeline/src/contract/`, the two verb wirings in `packages/cli/src/commands/`, every `PT-107-*` in `tests/parity/107/` and every `CT-107-*` in `tests/characterization/107/`. This feature writes no file into `packages/contracts/`: the record schema of the launch contract and the closed sets are generated there by feature 100.

## Phase 1: Setup and captures

- [ ] T001 Capture the reference for the fixtures FX-32, FX-33 and FX-34 from the baseline of mixture-of-loops at `9c88f86` through the stub verbs of feature 141: `greeting-ready`, `greeting-blocked`, `ambiguous-feature`, `tasks-unreadable-by-old-grammar`, `valid`, the ten members of `invalid-<class>` (`invalid-unreadable`, `invalid-structure`, `invalid-action`, `invalid-check`, `invalid-verification-commands`, `invalid-learning`, `invalid-auto`, `invalid-open-blocker`, `invalid-unchecked-prerequisite`, `invalid-not-promoted`, the last through the entry point `launcher-render`), `stale-sources`, `learning-decisions-changed`, `promote`, `render`, `edited-launcher`, `bundle-reused`, `stale`. Write the two scenarios that this feature adds inside the scope of their families (feature 141 §O.1 rule 4), capture them on the reference and register their names in the catalogue: `FX-32/107-plan-with-other-fence` (a plan with a fence of another kind before a shell block, for the accident of F107-FR-004) and `FX-33/107-promote-unreadable` (`--promote` on a file that is not JSON, for the preserved defect of F107-FR-021). This is the first task; no requirement is written against an uncaptured behaviour
  - fixture: FX-32, FX-33, FX-34
- [ ] T002 Create the directory `packages/pipeline/src/contract/` in the package `@specstride/pipeline` (layer L5, owners 107 and 123) with its sub-directories as in plan.md; confirm with the import-boundary check that it imports only `@specstride/contracts`, `@specstride/kernel`, `@specstride/spec-formats` and `@specstride/config`
- [ ] T003 [P] Write the schemas of the items that this feature owns (a source, the records of the inventory with `inventory.judgment`, the members of `configuration` with `relaunch`, `comment`, `scopes` and `verification`, a coverage entry, a finding, a stage with its action, its checks and its recovery) in `packages/pipeline/src/contract/schemas/`, each with an `$id` of the internal form `urn:specstride:schema:internal:107:<name>/1` (row 32 of the table "What the other features must follow" of feature 100), with the member names of data-model.md. Read the record schema `launch-contract.schema.json` and the closed sets (annex X §X.6 rows 78, 79, 256 to 261 and 274) from `@specstride/contracts`, where feature 100 generates them; write nothing into that package, and report the closed sets of the spec that have no row yet (T061)
- [ ] T004 [P] Write the synthetic feature generator of the payload check (20 and 200 tasks, same questions) in `tests/characterization/107/payload-check/`

## Phase 2: Foundational

- [ ] T005 Compose the validator in `packages/pipeline/src/contract/validate/compose.ts`: the record schema and the record-level validator of `@specstride/contracts` (feature 100, T196), joined by reference with the item schemas of T003, and the post-schema rules of research.md row 14; no rule in two places (F107-FR-012)
- [ ] T006 [P] Wire the canonical hasher, the redactor and the atomic write of `@specstride/kernel` into `packages/pipeline/src/contract/`; no hasher is written here
- [ ] T007 [P] Wire the canonical spec model (EP-03) and the registries of stage kinds and checks (EP-19) as consumed interfaces, with test doubles from `@specstride/testkit`; define the two ports that the command wiring hands over (the harness registry with the `completion` call; the rules of the learning binding that feature 106 exports) in `packages/pipeline/src/contract/ports.ts`
- [ ] T008 Define the exit-code and line tables of the three commands from annex G §G.4, this spec and contracts/commands.md (the as-is lines, and the product lines that are never printed under the `parity` profile) in `packages/pipeline/src/contract/commands/`, and the verb wiring of `contract`, which accepts a logical name wherever an argument names state, in `packages/cli/src/commands/contract.ts`
- [ ] T046 [P] [US4] Characterization test CT-107-10 for the modes: `run` by default, the mode map of the as-is names as data, an explicit mode beats a selection by the comment, no comment turns `dry-run` into `run`, an unknown mode is refused with `unknown-mode` and no launch record, in `tests/characterization/107/modes.test.ts`. The choice of a mode from prose is feature 123's (`supervise mode`, the scenarios `FX-36/mode-<case>`) and is not tested here
  - proves: F107-FR-032
- [ ] T051 [US4] Implement the modes, the mode map and the argument handling of `launch` (`--mode`, `--dry-run`, `--comment`, `--comment-selects mode`) in `packages/pipeline/src/contract/launch/modes.ts`, and the verb wiring of `launch`, which calls the handshake of feature 122 in the mode `run`, in `packages/cli/src/commands/launch.ts`

## Phase 3: User Story 1 - Derive a launch contract (P1)

- [ ] T009 [P] [US1] Parity test PT-107-011FR001-inventory in `tests/parity/107/inventory.test.ts`
  - proves: 011 FR-001; C-213
  - fixture: FX-32
  - surfaces: exit, stdout, stderr, tree, state
- [ ] T010 [P] [US1] Parity tests PT-107-011FR002-draft, PT-107-C-209-derive-command, PT-107-C-210-derive-flags, PT-107-C-211-derive-exit and PT-107-C-212-derive-output in `tests/parity/107/draft.test.ts`.
  - proves: 011 FR-002; C-209; C-210; C-211; C-212
  - fixture: FX-32/greeting-ready, FX-32/greeting-blocked
  - surfaces: exit, stdout, stderr, tree, state
- [ ] T011 [P] [US1] Parity test PT-107-C-213-candidates for ambiguity, repository facts, shell and prerequisite candidates, the reading of fences with its accident included, in `tests/parity/107/candidates.test.ts`
  - proves: C-213; C-210
  - fixture: FX-32/ambiguous-feature, FX-32/greeting-ready, FX-32/107-plan-with-other-fence
- [ ] T012 [P] [US1] Characterization test CT-107-1 for tasks read only through the canonical model, and the waiver scenario (DV-060) in `tests/characterization/107/tasks-model.test.ts`
  - proves: F107-FR-007
  - fixture: FX-32/tasks-unreadable-by-old-grammar
- [ ] T013 [P] [US1] Characterization test CT-107-2 for the verification-plan source: conflicts are blockers, empty phases stay empty, counts reported, and `reads`, `writes` and `sideEffects` of a repository file are never reported as declarations, in `tests/characterization/107/verification-source.test.ts`; the same file runs the conformance suite of EP-07 (`packages/testkit/src/conformance/EP-07/`) on this source
  - proves: F107-FR-008
- [ ] T014 [P] [US1] Characterization test CT-107-3 for the judgment exchange: batch at most 8,400 bytes, remaining count, constant total, a batch of zero items, an excerpt that is redacted and cut at a line end under its cap, an interrupted exchange that continues from the draft, in `tests/characterization/107/payload-check/exchange.test.ts`
  - proves: F107-FR-009; F107-SC-001
- [ ] T015 [P] [US1] Characterization test CT-107-4 for choices only, the three refused answers (exit 2, the item unchanged), provenance in `inventory.judgment` and in the findings, framing of excerpts as data with a boundary per call, in `tests/characterization/107/judgment-items.test.ts`
  - proves: F107-FR-010
- [ ] T065 [P] [US1] Characterization test CT-107-19 for the completion of the draft: one `specstride` stage per feature in order; a precondition for a prerequisite answered `mapped`; the verification-commands document under its logical name with only declared commands; coverage settled by fact for ticked and unticked tasks; the entries and findings of each kind of item and each choice of the table "Judgment items"; the bootstrap finding resolved; equal inputs give equal bytes; a kept blocker leaves a complete draft that promotion refuses; the host writes nothing, in `tests/characterization/107/completion.test.ts`
  - proves: F107-FR-041; F107-SC-008
- [ ] T016 [US1] Implement the inventory (sources, kinds, hashes from `inputs` and from the content hash, line counts, sort order, the record of each feature) in `packages/pipeline/src/contract/inventory/sources.ts`
- [ ] T017 [US1] Implement feature resolution and repository facts in `packages/pipeline/src/contract/inventory/features.ts`
- [ ] T018 [US1] Implement the candidates (shell with the baseline's reading of fences, prerequisites, verification document, obligation ids over the content hash of a text) in `packages/pipeline/src/contract/inventory/candidates.ts`
- [ ] T019 [US1] Implement the verification-plan source (EP-07: `discover`, `obligations`, `conflicts`) in `packages/pipeline/src/contract/inventory/verification-source.ts`
- [ ] T020 [US1] Implement the draft builder and the single bootstrap finding, with the member names of data-model.md, in `packages/pipeline/src/contract/draft/build.ts`
- [ ] T021 [US1] Implement `contract derive`: the options of F107-FR-002 with the two of the learning binding handed to the port, the hash of the comment recorded before anything is printed, the draft on standard output in compatibility output and under its logical name with one line in default output, and its exit codes, in `packages/pipeline/src/contract/commands/derive.ts`
- [ ] T022 [US1] Implement the making of judgment items when the exchange starts (the four kinds with their choices, grouped by question and never by task) and their record in `inventory.judgment` in `packages/pipeline/src/contract/judgment/items.ts`
- [ ] T023 [US1] Implement `--next-batch` and `--answer`: batches computed from the items and the byte limit, answers and provenance written into the draft, no cursor file, in `packages/pipeline/src/contract/judgment/batches.ts`
- [ ] T066 [US1] Implement the completion of the draft (stages, preconditions, coverage, findings, the resolved bootstrap finding) as a pure function in `packages/pipeline/src/contract/draft/complete.ts`, called by T023
- [ ] T067 [US1] Implement the writer of the verification-commands document under `feature:<slug>:verification:commands`, in the shape of F105-FR-016, in `packages/pipeline/src/contract/draft/verification-commands.ts`

## Phase 4: User Story 2 - Validate, promote, render, refuse edits (P1)

- [ ] T024 [P] [US2] Parity tests PT-107-011FR004-validation-identity for identity, roots and sources, PT-107-C-218-validator for stages, actions, checks and the verification-commands file, and PT-107-C-236-validate-lines in `tests/parity/107/validate-identity.test.ts`
  - proves: 011 FR-004; C-218; C-236
  - fixture: FX-33/valid, FX-33/invalid-unreadable, FX-33/invalid-structure, FX-33/invalid-action, FX-33/invalid-check, FX-33/invalid-verification-commands, FX-33/invalid-learning, FX-33/invalid-auto
  - surfaces: exit, stdout, stderr, state
- [ ] T025 [P] [US2] Parity test PT-107-011FR005-validation-coverage for open blockers and unresolved coverage in `tests/parity/107/validate-coverage.test.ts`
  - proves: 011 FR-005; C-218
  - fixture: FX-33/invalid-open-blocker, FX-33/invalid-unchecked-prerequisite
- [ ] T026 [P] [US2] Parity tests PT-107-011FR006-promotion through the mapping for success, failure, hints and exit 20, the rewrite (key order, the stamp as the last key, a final line end) and the preserved defect on a file that cannot be read, PT-107-C-232-validate-command, PT-107-C-233-validate-flags, PT-107-C-234-validate-exit and PT-107-C-235-validate-file in `tests/parity/107/promote.test.ts`
  - proves: 011 FR-006; C-232; C-233; C-234; C-235; C-236
  - fixture: FX-33/promote, FX-33/stale-sources, FX-33/learning-decisions-changed, FX-33/107-promote-unreadable
  - surfaces: exit, stdout, stderr, state
- [ ] T027 [P] [US2] Parity test PT-107-C-216-artifact-names through the layout table in `tests/parity/107/layout-names.test.ts`
  - proves: C-216
  - fixture: FX-33/valid, FX-34/render
- [ ] T028 [P] [US2] Parity tests PT-107-011FR008-render for the stamp, staleness, the order of the checks and the exit codes, PT-107-C-219-render-command, PT-107-C-220-replace-edited and PT-107-C-221-render-exit in `tests/parity/107/render.test.ts`
  - proves: 011 FR-008; C-219; C-220; C-221
  - fixture: FX-34/render, FX-34/edited-launcher, FX-34/stale, FX-33/invalid-not-promoted
  - surfaces: exit, stdout, stderr, launcher, state
- [ ] T029 [P] [US2] Parity tests PT-107-011FR009-bundle through the mapping N-10 and N-11, PT-107-C-222-render-files and PT-107-C-224-render-behaviour in `tests/parity/107/bundle.test.ts`
  - proves: 011 FR-009; C-222; C-224
  - fixture: FX-34/render, FX-34/bundle-reused
  - surfaces: launcher, state
- [ ] T030 [P] [US2] Parity tests PT-107-011FR010-launcher through the mapping N-17 and PT-107-C-223-render-lines in `tests/parity/107/launcher.test.ts`
  - proves: 011 FR-010; C-223; C-224
  - fixture: FX-34/render
  - surfaces: launcher
- [ ] T031 [P] [US2] Characterization tests CT-107-6 for legacy spellings refused, CT-107-7 for the key rename and the unread keys, CT-107-8 for the ceilings and for the relaunch block written only when a key differs from its default, in `tests/characterization/107/legacy-and-keys.test.ts`
  - proves: F107-FR-023; F107-FR-024; F107-FR-025
- [ ] T032 [P] [US2] Characterization test CT-107-9 for seeded edits of the launch contract inside the bundle, of another file of the bundle, of the manifest and of the launcher, at the start of the launcher and at a relaunch, each refused with exit 20 and one line, in `tests/characterization/107/integrity.test.ts`
  - proves: F107-FR-031; F107-SC-004; F107-SC-005
- [ ] T033 [US2] Implement the post-schema rules of identity, roots, sources, stages, actions, checks (with `command_success`), coverage and findings, with a logical name resolved through the layout and outside the rule of the roots, in `packages/pipeline/src/contract/validate/rules.ts`
- [ ] T034 [US2] Implement the validation order and the calls of the staleness verdict and of the learning binding through its port in `packages/pipeline/src/contract/validate/order.ts`
- [ ] T035 [US2] Implement canonical bytes, the stamp and promotion, including the rewrite that keeps key order and the set-back that removes the stamp, in `packages/pipeline/src/contract/promote/promote.ts`
- [ ] T036 [US2] Implement the supervision ceilings and the bound of the stages in `packages/pipeline/src/contract/validate/supervision.ts`
- [ ] T037 [US2] Implement `contract validate` flags (the nine rules that `--allow-draft` skips), lines and exit codes in `packages/pipeline/src/contract/commands/validate.ts`
- [ ] T038 [US2] Implement the launch bundle (address, manifest, the hash of the bundle, atomic publish, reuse check) in `packages/pipeline/src/contract/render/bundle.ts`
- [ ] T039 [US2] Implement the launcher (interpreter line of the runtime, marker, own-content hash, the bundle named by logical name and by its hash, mode, atomic write) and the edited-launcher refusal in `packages/pipeline/src/contract/render/launcher.ts`
- [ ] T040 [US2] Implement `contract render` in the order of the baseline in `packages/pipeline/src/contract/commands/render.ts`
- [ ] T041 [US2] Implement the integrity check of the bundle and the launcher (the four assertions of F107-FR-031), called at every start of the launcher, of the pipeline entry and of the runtime root, in `packages/pipeline/src/contract/launch/integrity.ts`

## Phase 5: User Story 3 - The comment (P1)

- [ ] T042 [P] [US3] Characterization test CT-107-12: `contract derive` records the hash over the verbatim text before it prints anything; `launch` with the same text stores the redacted comment and hands the hash to the launch record; another comment, or a comment on one side only, is refused with `comment-changed`; a relaunch is not compared, in `tests/characterization/107/comment-store.test.ts`
  - proves: F107-FR-034
- [ ] T043 [P] [US3] Characterization test CT-107-13 for a comment that asks to skip a check, a comment laundered from repository text, `--comment-selects` for each of the four options with a value that narrows and with one that widens (refused, nothing written), and the record in `configuration.comment` that the keys `comment` and `changed` of the digest are read from, in `tests/characterization/107/comment-effect.test.ts`
  - proves: F107-FR-035; F107-SC-002
- [ ] T044 [US3] Implement the comment path (argument, hash at derivation, comparison and store at launch, redact, size cap) in `packages/pipeline/src/contract/launch/comment.ts`
- [ ] T045 [US3] Implement `--comment-selects`: the closed set of options, the check that a value narrows, and the record of what changed, in `packages/pipeline/src/contract/launch/steer.ts`

## Phase 6: User Story 4 - Modes and dry-run (P2)

- [ ] T047 [P] [US4] Characterization test CT-107-11 for `dry-run`: `launch` derives nothing; it launches nothing (process watch, state comparison, no comment record); exit 0 with the report; exit 20 and a `next:` line without a promoted launch contract; exit 23 on stale sources; a launch check that would refuse is a line of the report, in `tests/characterization/107/dry-run.test.ts`
  - proves: F107-FR-033; F107-SC-003
- [ ] T048 [P] [US4] Characterization test CT-107-16 for the parallel plan: printed once with parallel units on, as part of the plan of the pipeline entry; no line with them off, in `tests/characterization/107/dry-run-parallel.test.ts`
  - proves: F107-FR-038
- [ ] T049 [P] [US4] Characterization test CT-107-14 for the verification mode and its reason (`declared`, `configured`) in `tests/characterization/107/verification-mode.test.ts`
  - proves: F107-FR-036; F107-SC-007
- [ ] T050 [P] [US4] Characterization test CT-107-15 for declared scopes, reads and writes: provenance, validation, `configuration.scopes`, a command without a declaration undeclared and serial, `stages[].writes[]` unused, in `tests/characterization/107/declarations.test.ts`
  - proves: F107-FR-037
- [ ] T052 [US4] Implement `dry-run` (validate again, the report, the launch checks evaluated without launching, the read-only plan of the pipeline entry; no derivation) in `packages/pipeline/src/contract/launch/dry-run.ts`
- [ ] T053 [US4] Implement derivation's verification-mode rule and its reason in `packages/pipeline/src/contract/draft/verification-mode.ts`
- [ ] T054 [US4] Implement the declarations and their provenance check in `packages/pipeline/src/contract/validate/declarations.ts`

## Phase 7: User Story 5 - Delegated judgment (P3)

- [ ] T055 [P] [US5] Characterization test CT-107-5 for delegation through a fake harness, the route `delegated-harness` in the provenance of every answer (the source of the key `delegated` of the digest), and the refusal without a named harness in `tests/characterization/107/delegation.test.ts`
  - proves: F107-FR-011
- [ ] T056 [US5] Implement delegation through the `completion` level, resolved from the registry through the port, in `packages/pipeline/src/contract/judgment/delegate.ts`
- [ ] T057 [US5] Paid probe (paid, must be logged, not run by the specification): one delegated batch through each Wave 1 harness adapter, to move the `unverified` status of F107-FR-011
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F107-FR-011

## Phase 8: Polish

- [ ] T058 [P] Characterization test CT-107-17 for terse output: logical names in lines and as arguments, no echo of repository text, the draft never on standard output in default output, no product line under the `parity` profile, in `tests/characterization/107/output.test.ts`
  - proves: F107-FR-039; F107-FR-006
- [ ] T059 Payload check in CI, as a step of the build that runs the file of T014 on the generator of T004: the synthetic feature of at least 200 tasks against the one of 20 tasks; batches at most 8,400 bytes; totals within 5 per cent; the excerpt cap is tuned here
  - proves: F107-SC-001
- [ ] T062 [P] Characterization test for bounded supervision values on seeded launch contracts (a ceiling exceeded, the bound of the stages exceeded, each named), and for the count of coverage entries on the fixtures, in `tests/characterization/107/coverage-and-bounds.test.ts`
  - proves: F107-SC-008; F107-SC-009
- [ ] T060 Run FX-32, FX-33 and FX-34 under the `parity` profile on Linux; record results; macOS runner run marked `unverified` until it passes
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F107-SC-006
- [ ] T061 [P] Hand the items of `analyze-report.md`, "What another feature or the orchestrator must do (after the second run)", to their owners and record each answer there. Item 1 (the register row and the entry of the key-name map for `schema_version` and `schema`) is a precondition of an `equal` result of T010 and T024. The row of annex X §X.6 for the error classes, the register rows DV-096 and DV-097, the profile rows 47 and 48 and the logical name of the comment exist and are not asked for
- [ ] T063 [P] [US2] Characterization test CT-107-18 for the error classes of validation: every rule of the validator has exactly one of the ten classes (static test over the table), `--json` names the class of each error, the default lines do not, every class exits 20, in `tests/characterization/107/error-classes.test.ts`
  - proves: F107-FR-040
  - fixture: FX-33/invalid-<class>, the ten members
- [ ] T064 [US2] Implement the table of error classes and the class in the `--json` form of `contract validate` and `contract render` in `packages/pipeline/src/contract/validate/classes.ts`

## Dependencies

- T001 first. T002 to T008, T046 and T051 before every story. Within a story, test tasks before implementation tasks.
- US1: T066 and T067 need T022 and T023, and T023 calls T066. US2 needs the draft of US1 (T020) and, for its fixtures of a complete launch contract, T066. US3 needs `launch` (T051) and `contract derive` (T021). US4 needs T051 and the render of US2 (T040). US5 needs the batches of T023.
- T063 before T064; T064 needs T033 and T037.
- T057 is paid and is a precondition of no other task.
- T041 is called by the launcher and by feature 123's pipeline entry and runtime root; the code it returns is that of annex F §F.8 (20).

## Coverage of success criteria and of the requirements that several tasks share

| Id | Measured or built by |
|---|---|
| F107-FR-005, F107-FR-006 | T010 (parity), T058 (characterization), T020, T021 |
| F107-FR-012 to F107-FR-017 | T024, T025 (parity), T003, T005, T033 |
| F107-FR-018 to F107-FR-022 | T024, T026 (parity), T034, T035, T037 |
| F107-FR-026 to F107-FR-030 | T027 to T030 (parity), T038, T039, T040 |
| F107-FR-041 | T065 (characterization), T066, T067 |
| F107-SC-001 | T014, T059 |
| F107-SC-002 | T043 |
| F107-SC-003 | T047 |
| F107-SC-004, F107-SC-005 | T032, T028 |
| F107-SC-006 | T060 |
| F107-SC-007 | T049 |
| F107-SC-008 | T065, T062 |
| F107-SC-009 | T062 |
