# Analyze report: Claude harness adapter (feature 125)

Date: 2026-09-29. Read-only analysis of `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md` and `contracts/`. Runs: 1 (no repair round needed after the checks below; two edits were made before the run, see "Repairs").

## Result

| Check | Result |
|---|---|
| Functional requirements | 41 (F125-FR-001 to F125-FR-041), all with a `test:` |
| Success criteria | 10 (F125-SC-001 to F125-SC-010), all measurable |
| Requirements with an as-is origin | 9 (FR-007 to FR-012 and FR-027 to FR-029; their tests are PT-125-*) |
| Kept items of the traceability files | 16 of 16 in 5 clusters, all cited in an `origin:` (C-052, C-056, C-058, C-061, C-066) |
| Every test named in `spec.md` has a task in `tasks.md` | Yes: 43 names, 0 missing |
| Every cluster and item is in the `proves:` of a test task | Yes (`check-traceability.py`: no line names feature 125) |
| `[NEEDS CLARIFICATION]` markers | 0 |
| Constitution Check (twenty principles) | All answered; no failure; Complexity Tracking empty |
| Split | Not needed: 41 is below about 45 |

## Findings and how each was settled

| # | Severity | Finding | Where | Settled |
|---|---|---|---|---|
| 1 | Medium | Ruling 36 says the real home is never written and the criterion says it is byte-identical after a run, but the harness keeps session state and its own bookkeeping there and the spec must remove session state at the end of a phase attempt | FR-014, FR-015, SC-003 | Proceeded on the narrowest reading: the harness adapter writes nothing and only removes the state of the sessions it minted; the harness's own files are excluded from the byte comparison and listed by a capture. Reported as CQ-143 |
| 2 | Medium | B-0911 (ported) keeps a fallback window of 200,000 tokens for an unlisted model; Principle IX says there is no default window for an unknown model | FR-027 | Kept as the as-is behaviour, marked `adapter`, the consumer's window wins. Reported as CQ-145; no register row could be written without `DV-new` |
| 3 | Low | R5 says a failed proof is scored as a failed critic call; feature 100 makes it `critic_not_toolless`, a configuration error that halts the run | FR-024 | Feature 100 stands; recorded in `research.md` D-10 |
| 4 | Low | Four switches introduced here have no row in annex X §X.7 | Rows table of the spec | Listed as "row needed" with default and `parity` value; reported |
| 5 | Low | The alias table of annex X §X.8 has no row for `SPECSTRIDE_PROPOSER_SKILLS`, `SPECSTRIDE_CLAUDE_CRITIC_*`, `SPECSTRIDE_BACKEND_LABEL` and `SPECSTRIDE_STDIN_FILE` | FR-007, FR-010, FR-011, FR-029 | Keys proposed in the spec; reported |
| 6 | Low | The brief estimated 31 requirements; the specification has 41 because each as-is cluster needed its own requirement and the SDK group has eight | Whole spec | Kept; below the split threshold |
| 7 | Info | Terms: bare `adapter` was replaced by `harness adapter` throughout; `hook` appears only as `host hook` | Whole spec | Repaired |
| 8 | Info | Several facts rest on documentation only (sandbox setting, environment variables, hidden flags, the limit event shape, terms rows) | Status fields | Marked `unverified` with the check; four captures and one paid probe are tasks |

## Coverage of the brief

| Heading of the brief | Where |
|---|---|
| G1 detection, version, descriptor, doctor | FR-001 to FR-006 |
| G2 proposer | FR-007 to FR-022 |
| G3 critic | FR-023 to FR-030 |
| G4 quota, usage, ladder | FR-031 to FR-033 |
| G5 SDK transport | FR-034 to FR-041 |
| Tests: parity, characterization, conformance on both transports, own tests, captures, live probe | `tasks.md` T001 to T004 (captures), T016 to T021 and T035 to T037 (parity), T008 to T010 and the CT tasks, T065 (conformance), T061 to T064 (own tests), T076 (paid probe) |
| Success criteria the brief carries (five) | SC-001 (session), SC-002 (dated facts), SC-003 (configuration home), SC-004 (SDK not bundled), SC-005 (no subscription through the SDK); SC-006 to SC-010 added |

## Repairs

1. Before the run: the words "the adapter" were replaced by "the harness adapter", "code hooks" by "code", and "gate" by "phase gate" where it stood alone.
2. Before the run: the count of fixture families and named tests in `plan.md` was corrected, and `FX-39` moved to the task that tests the throwaway home.

## What remains

Nothing failed. The open readings CQ-143 to CQ-148 are for the orchestrator's queue. The captures A to E and the paid probe P are open by design.

## After the cross-feature review

Date: 2026-09-30. Source: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section of feature 125 (4 own items, 9 pointers), and the table "What the other features must follow" of `specs/100-specstride/repair-report.md`. Every item was checked against the file before a change. The full list is in `repair-report.md`.

### What changed

| Subject | Change | Files |
|---|---|---|
| Critic diversity (W-125-01) | F125-FR-026 no longer opens with a MUST on the model tier. The rule and its trigger are those of F100-FR-024: same model, warning recorded in `criticPick`, never blocking | `spec.md`, `tasks.md` T041, `contracts/argument-table.md` |
| Bypass permission mode (W-125-02) | The consumer chooses it in user configuration only (CQ-183); the harness adapter checks the precondition and refuses the launch where it fails. New test CT-125-33, task T080 | `spec.md`, `tasks.md` T030, `contracts/argument-table.md`, `research.md` D-6 |
| Principles VIII and IX (W-125-03) | The spec takes the reading nearest to the letter: no removal in the real home, no persisted session state and no continuation at auth tier 1 until capture E; no default window outside `parity`. Rows VIII and IX are recorded deviations with two rows in Complexity Tracking. New test CT-125-34, task T081 | `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `quickstart.md`, `research.md` D-18, D-19 |
| Terms (W-125-04) | "auth tier" and "model tier" are never bare; "critic-diversity warning" is the one name | every file but this report's earlier sections |
| Pointers | `retryable` per class; register named without a count; rows 119 to 122 cited by number; Constitution Check in the form of the template, v3.0.0 named; no task waits for a paid capture; the terms gate is feature 147; `implements (an entry)` for EP-14; contracts of feature 100 named in place of features 112 and 109 | `contracts/classifier-table.md`, `spec.md`, `plan.md`, `tasks.md`, `contracts/terms-rows.md`, `data-model.md` |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Functional requirements | 41, all with a `test:`; success criteria 10 |
| Named tests | 45 (34 CT-125-n, 11 PT-125); each has a task with `proves:`. CT-125-33 is T080, CT-125-34 is T081 |
| Tasks | 81 (T001 to T081) |
| Requirement without a task | None |
| Task without a requirement | None among the test tasks; T005, T006, T077 to T079 are setup and reporting tasks, as before |
| Session state | `spec.md` (F125-FR-013 to F125-FR-015, F125-SC-003), `plan.md` (Storage, Constraints, row VIII, capture E), `tasks.md` (T004, T014, T024, T047), `data-model.md` and `quickstart.md` step 4 say the same: nothing written or removed in the real home, nothing persisted at auth tier 1 |
| Context window | F125-FR-027, row IX, T081 and research D-19 agree: 200,000 under `parity` only |
| Bypass mode | F125-FR-006, F125-FR-012, the edge case, the constraint row, the clarification, the profile table, T030, T080, both tables of `contracts/argument-table.md` and research D-6 agree |
| Paid captures | `tasks.md` (Phase 1, T055, T065, T077, Dependencies), `plan.md` (Summary, Testing, captures table), F125-FR-038, F125-SC-009, `contracts/classifier-table.md` and `quickstart.md` step 6 agree: a capture blocks the freeze of a status and nothing else |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h; feature 125: 16 of 16 |

### What remains

1. The earlier sections of this report are a record of 2026-09-29 and were not rewritten: they still say 43 tests, "Complexity Tracking empty" and the first reading of CQ-143 and CQ-145.
2. Feature 100 differs from this feature in two places (annex B §B.5, the row of `attempt:…:session`; F100-FR-231, the window of a configured critic on an unlisted model). Both are reported in `repair-report.md`.
3. `retryable` per class is not yet stated by the class table of the quota classifier; the values of the review are used.
