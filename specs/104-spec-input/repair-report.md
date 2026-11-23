# Repair report — 104-spec-input

Dated 2026-09-30. Worklist: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section "Feature 104 — 104-spec-input". Every item was checked against the files before a change was made. Only files inside `specs/104-spec-input/` were written.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-104-01 | repair | high | done | `plan.md` (Summary, Primary Dependencies, Project Type, Source Code, Structure Decision); `tasks.md` T007; `spec.md` F104-FR-021, F104-SC-001, "Contracts of feature 100 used"; `research.md` D-9; `data-model.md`; `contracts/README.md` | Verified: the plan had `packages/spec-formats/src/hash.ts`, and the package graph names `@specstride/kernel` with the owner "104 (hasher)". The hasher is now `packages/kernel/src/hasher/`, built by this feature. It holds all four operations of annex X §X.5, because features 102 and 103 call the task-list hash from packages that cannot import `spec-formats`. What the task-list hash covers is the rule of F104-FR-022, stated by this feature; the hasher reads no phase heading. The sentences of plans 105 and 106 are not mine: plan 105 (`specs/105-verification/plan.md:39`) has the sentence; plan 106 (`specs/106-learning/plan.md:39`) still says "the canonical hasher of feature 100" |
| W-X-02 | repair | high | done | `tasks.md` T040, T041; `plan.md` (Testing, Source Code) | Suite cases in `packages/testkit/src/conformance/EP-03/behaviour.test.ts`, sample in `packages/testkit/src/samples/EP-03/sample-format.ts`, beside the contract-level suite and the minimal sample of feature 100 (its T100, T101) |
| W-115-01 | repair | medium | done | `spec.md` F104-FR-026, Key Entities; `tasks.md` T037, T050; `data-model.md`; `contracts/verdict.md` | The reading is the content of `run:<runId>:task-list`. The engine writes the record; this feature gives the reading and writes nothing |
| W-X-10 | repair | medium | done | `spec.md` F104-FR-026 (assumption line), the row CQ-044 of the assumptions, "Contracts of feature 100 used" | Both sentences verified and replaced by the citation of annex B §B.5. `assumption: CQ-044` stays on the requirement, with the note that the answer is applied |
| W-X-09 | repair | medium | done | `plan.md` row XVII; `tasks.md` T054; `research.md` | Row XVII is a pass with a reason about tests. T054 is the macOS and skip task |
| W-X-14 | repair | medium | done | `plan.md`, Constitution Check | The version v3.0.0 is named; every pass cites its requirement; twenty rows, the gate line and Complexity Tracking were there already |
| W-X-20 | repair | medium | done | `tasks.md` T003, T009 to T013, T018 to T022, T031, T032, T038, T040, and T044 to T052 | Verified: 52 of 67 names were in no task. Now 0. Existing tasks hold several named tests of one file; nine test tasks were appended. No test name changed |
| W-X-27 | repair | medium | done | `plan.md` Primary Dependencies; `research.md` D-10 | The plan chooses no validator and names none as its own dependency. This feature reads no YAML file |
| W-X-28 | repair | low | done | `plan.md` (Testing, Source Code, "Place of tests"); every test path of `tasks.md`; `quickstart.md`; `research.md` D-11 | `tests/parity/104/` and `tests/characterization/104/`. See the choice under "What another feature or the orchestrator must do", point 3 |
| W-X-29 | repair | low | done | `plan.md` row XIX; `tasks.md` T053 | Figures in bytes, as starting values: 200 bytes per call of the short subcommands, 200 bytes per finding line, 16 bytes per phase for `numbers`. T053 measures them with the helper of T194 of feature 100 |
| W-100-11 | repair | low | done (no code changed) | `spec.md` F104-FR-020 and one edge case; `contracts/spec-verb.md`; `tasks.md` T052; `quickstart.md` | Verified against annex G §G.4 as repaired: row `spec` gives 0, 1, 2, 3; the row of exit 1 is about the first argument. Exit 2 for an unknown subcommand of `spec` stands. The assumption text of CQ-042 said annex G holds no 1; that was out of date and is changed. CQ-042 stays open |
| `CQ-pending-*` placeholders | — | — | done | `checklists/requirements.md:34` | The one placeholder was in a note of the checklist; it now names CQ-039 to CQ-044 |

Counts: 11 items done, 0 not applied, 0 open.

## Requirements added or changed in place

None added. Changed in place: F104-FR-020, F104-FR-021, F104-FR-026, F104-SC-001. They are listed in `spec.md`, section "Repairs after the cross-feature review".

The feature has 27 functional requirements, 8 success criteria and 54 tasks (before: 43).

## What another feature or the orchestrator must do

1. Feature 106: `specs/106-learning/plan.md:39` still says "the canonical hasher of feature 100 (annex X §X.5)" and names the validator as a dependency. W-104-01 asks for "the canonical hasher of feature 104 in `@specstride/kernel`".
2. Feature 100, annex G §G.4, row `spec`: the causes of exit 3 are "invalid spec, unknown explicit format, unreadable file". F104-FR-020 also gives 3 for a missing phase number of `tick`, `title`, `shape` and `slice`, as at the baseline (C-144). The row should name it.
3. A choice I made on W-X-28: CT-104-1 to CT-104-3 pin as-is behaviour and are in `tests/characterization/104/`. CT-104-5 to CT-104-8 test requirements of this feature and pin nothing of the reference, so by the rule of feature 100 ("unit and contract tests of a package stay in the `test/` directory of the package") they are in `packages/spec-formats/test/`. CT-104-4 is the conformance suite and is in the test kit. If every `CT-` name is to be in `tests/characterization/104/`, four task paths change.
4. Feature 100 creates the kernel package with two modules. T007 of this feature adds the module `hasher` and needs the package to exist. The plan of feature 100 already says the hasher is planned by 104; no change is needed, only the order of the work.
5. The byte figures of row XIX are starting values that I set; no source gives them. Parity binds the text of the verb, so a breach cannot be repaired by cutting the output.

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| 1 | The staleness verdict (F104-FR-024, F104-FR-027: "one function") is in `@specstride/spec-formats`. `@specstride/core` may import `contracts` and `kernel` only, and feature 103 compares the hashes itself through the hasher (`specs/103-proposer-pass/plan.md:162`). How does a core package reach the one verdict function? | Package graph of feature 100; annex C §C.7 (EP-03 has five operations and no verdict); F104-FR-027; plan 103 | The classification of the verdict (recorded hashes and hashes now give `unchanged`, `ticks-only`, `changed`, `unreadable`) moves into the hasher module of the kernel as a pure function, owner 104; the package `spec-formats` keeps the reading of files and the lines. No operation is added to EP-03 | With a sixth operation of EP-03, annex C changes and the version of the extension point is touched. With the comparison left to each consumer, F104-FR-027 is not true for features 102 and 103 |

Not applied by me: it needs feature 100 or the orchestrator to decide. The feature proceeds on its text as it is.

## Register rows needed (with the text)

None.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | The feature has none |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h. Feature 104: 117 items, 116 kept. An earlier run during this repair failed with 7 errors of kinds `[d]` and `[f]` (register rows DV-114 to DV-117, `traceability.md`), none about feature 104; they were gone in the later run |
| Test names of `spec.md` against `tasks.md` | 67 names, 67 in tasks, 0 in tasks only |
| Stale strings (`hash.ts`, test paths inside the package, `CQ-pending`, "annex B holds no") | None left, except CQ-039, which says annex B holds no field for the format; that is still true |
| Analyze report | Section "After the cross-feature review" appended |
| Paid probes | None; no task of the feature calls a model |
