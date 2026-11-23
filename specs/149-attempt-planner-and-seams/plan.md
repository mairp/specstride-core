# Implementation Plan: Attempt planner and seams (feature 149)

**Branch**: `149-attempt-planner-and-seams` (a label; the directory is `specs/149-attempt-planner-and-seams`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/149-attempt-planner-and-seams/spec.md`

## Summary

Feature 149 is the content owner of EP-18: the seam of the critic strategy and the seam of the
attempt planner. It ships the strategy with one critic, the planner of the recovery cycle and the
planner of the model-tier bump, which is an option that is off by default. It also holds the
invariants that keep loop layers, the router and the planners away from the phase gate, and the
two integrity facts that are told to the critic and never halt.

| Deliverable | Requirements |
|---|---|
| Seam of the critic strategy; the strategy with one critic | F149-FR-001 |
| Seam of the attempt planner; the two planners of Wave 1 | F149-FR-002 |
| The model-tier bump: option, count, guards, rule table, ablation arm | F149-FR-003 to F149-FR-006 |
| Invariants of the phase gate; the calls of the loop layer | F149-FR-007 |
| Comparison of the tree at phase entry; the phase gate with a changed protected set | F149-FR-008, F149-FR-009 |
| Conformance suite and samples of EP-18 | F149-FR-010 |

Approach: everything here is new; there is no as-is code to port and no parity test. The seams
are two interface types of the `contracts` package with one registry each. The bump is a table
of `specstride.table/1`, evaluated by the evaluator of the kernel. The proof is ten
characterization tests, CT-149-1 to CT-149-10, with the stubs of feature 141 on the port side,
and the conformance suite in the test kit.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (interface types of EP-18, closed sets, schemas); `@specstride/kernel` (the table evaluator). No other runtime dependency

**Storage**: none of its own. Reads the ledger (namespace `core`), the records of phase attempts, the recovery markers and the approval record of the phase before, all by logical name (feature 100 annex B §B.5). Appends the count of rejections by the critic to the ledger through the engine

**Testing**: the Node test runner; property tests for the purity of a planner and for the bump table; a fuzz test of the verdict parser; a static test over the package graph; the conformance suite of EP-18 in `@specstride/testkit`; the stubs and fixtures of feature 141 on the port side. No test calls a paid API

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: part of the package `@specstride/core` of the npm workspace (layer L4), with the suite and the samples in `@specstride/testkit`

**Performance Goals**: starting value, low confidence: `next` returns in under 5 ms for a history of 20 phase attempts. It is not a gate: no requirement rests on it and no task measures it

**Constraints**: planners are pure (no I/O, no clock, no model); no native module; no harness name in control flow; no output differs with the option off

**Scale/Scope**: 10 functional requirements, 4 success criteria; no as-is id; 2 seams; 3 closed sets; 2 rows of the `parity` profile

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**The gate and the loop (I-V)**

- [x] I. ✅ Planners read records on disk through the engine and hold no state in memory between calls; counts live in the ledger
- [x] II. ✅ The seams cannot approve: a strategy returns a verdict record and never sees a nonce; no layer, router or planner holds a writer of the phase gate (F149-FR-001, F149-FR-007); every critic call is a fresh session
- [x] III. ✅ The whole verification gate runs before the critic whatever a loop layer returned (F149-FR-007); a changed protected set is a fact for the critic (F149-FR-009)
- [x] IV. N/A. No grammar of specifications
- [x] V. ✅ The events of a bump and of a skip go through the event writer; a failure of a seam degrades to MALFORMED or to `plain` and never breaks the loop

**The product and its edges (VI-XII)**

- [x] VI. ✅ Strict TypeScript; EP-18 implemented with a version, a conformance suite and samples outside the core (F149-FR-010); EP-02, EP-04, EP-05 consumed
- [x] VII. ✅ The ladder and the models of the critic come from the resolved registry; no list of harnesses
- [x] VIII. ✅ The phase attempt after a bump starts a fresh session (F149-FR-005); a bump stays on the same harness
- [x] IX. ✅ Every call of a strategy records the proof that the critic holds no tools or the read-only form (F149-FR-001)
- [x] X. N/A. No harness adapter
- [x] XI. ✅ Events in the one envelope; the events of this feature have no as-is equivalent and project to nothing
- [x] XII. ✅ Tests use stubs; model ids come from configuration; the state of a quota is read from records, no call is made to find it out

**The host skill (XIII-XVII)**

- [x] XIII. ✅ The bump is decided by a pure table and recorded with its rule id (F149-FR-006)
- [x] XIV. N/A. No verification command
- [x] XV. N/A. No launch
- [x] XVI. ✅ The count towards K survives a resume and a relaunch as the other counts do (F149-FR-004)
- [x] XVII. ✅ T034 runs the tests on the macOS runner when it exists; until then every macOS statement stays `unverified`, and a test whose prerequisite is missing reports a skip with its reason
- [x] XX. N/A. No parallel work

**The rewrite (XVIII-XIX)**

- [x] XVIII. ✅ No as-is behaviour is carried; the three intended differences cite DV-076, DV-077 and DV-079 and are off under the `parity` profile
- [x] XIX. ✅ No host-facing output. Share of the token budget of a host skill: 0

Re-check after Phase 1 design: no gate changed. No violation; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/149-attempt-planner-and-seams/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── ep18-seams.md            # operations, inputs, outputs of the two seams; the suite
│   ├── bump-table.json          # the rule table of the model-tier bump
│   ├── gate-writers-rule.json   # the import rule on the writers of the phase gate (T007)
│   └── ablation-tier-bump.md    # written by a task: the ablation arm
├── checklists/requirements.md
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/core/src/
├── ep18/
│   ├── critic-strategy.ts          # the seam, its registry, the strategy with one critic
│   ├── attempt-planner.ts          # the seam, its registry, the order of the planners
│   ├── planner-recovery.ts         # kinds of the recovery cycle from the history
│   ├── planner-tier-bump.ts        # the bump, over the bump table and the table evaluator
│   ├── bump-table.ts               # T003: the bump table as a frozen constant
│   └── history.ts                  # the read-only history of a phase, built from records
└── integrity/
    ├── gate-writers-guard.ts       # hands the writers of the phase gate to the phase gate only
    ├── layer-calls.ts              # onEvidence and contributeCriticInput around the phase gate
    ├── phase-entry.ts              # comparison of the tree at phase entry
    └── protected-set.ts            # the phase gate when the protected set changed

packages/testkit/src/conformance/EP-18/  # the suite of both seams, with CT-149-10 (the folder
                                         # name is the rule of feature 100: `EP-nn` in capitals)
packages/testkit/src/samples/EP-18/      # sample strategy (two calls), sample planner

packages/contracts/                       # T002, T004, T031: the test of the closed sets, the
                                          # types of EP-18 values (src/ep/ep18-values.ts), the rows
                                          # of the `parity` profile; nothing in data/ or schemas/
tools/import-boundary/rules/              # T007: the rule on the writers of the phase gate
                                          # (form of proposal P2 of analyze-report.md)
tests/release/149/                        # T034: the record of the macOS runner

tests/characterization/149/               # CT-149-1 to CT-149-9; the rule of feature 100
                                          # (repair report of 100, row 36): parity tests in
                                          # tests/parity/<feature>/, characterization tests in
                                          # tests/characterization/<feature>/. This feature has
                                          # no parity test (no as-is behaviour), so only the
                                          # second directory is used
```

**Structure Decision**: two directories, `ep18` and `integrity`, in the package
`@specstride/core` of the workspace that feature 100 creates. The loop that calls the seams
lives in the same package and belongs to its owner; this feature reaches it through the interface
types of EP-18 in the `contracts` package.

## Technology choices below the specification

| Subject | Choice | Reason |
|---|---|---|
| Registration of a strategy and of a planner | First-party code through the registration call of feature 100 annex A §A.4 | EP-18 is an internal seam; third-party code is not enabled in Wave 1 |
| The call function of a strategy | A closure given by the engine; the strategy gets the outcome of a call and no nonce | F149-FR-001 |
| Purity of a planner | The planner gets a frozen history and returns a value; a property test runs it twice and watches for writes | F149-FR-002 |
| Bump rule | `contracts/bump-table.json`, one decision point `attempt-tier`, eight rows, a default row; in the product the frozen constant `packages/core/src/ep18/bump-table.ts`, validated at load by the evaluator | F149-FR-006; the evaluator asks for a default row; `packages/contracts/data/` is clean-copied from feature 100 by its sync script |
| The plan of the next phase attempt and the outcome of a critic call | TypeScript types with guards in `packages/contracts/src/ep/ep18-values.ts`; no schema file | They are in-process values of an internal seam and are never written as records; the engine writes the verdict record and the record of the phase attempt |
| Reason of a skip | Derived from the rule id of the row that fired | The table form has no field for it |

## Complexity Tracking

No violation of the constitution. The table is empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
