# Repair report — 125-adapter-claude

Written on 2026-09-30 from the section of feature 125 of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`
(4 own items, 9 pointers) and from the table "What the other features must follow" of
`specs/100-specstride/repair-report.md`. Paths are relative to `specs/125-adapter-claude/`. Line
numbers are those of the files after the repair. Every item was checked against the file before a
change. No id was renumbered or reused. No CLI was run, no model was called, nothing was committed.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-125-01 | repair | high | done | `spec.md:27`, `:91` (scenario), `:328` (F125-FR-023), `:343` (F125-FR-026), `:584`, `:600` (clarifications); `tasks.md` T041; `contracts/argument-table.md` (row `--model` of the critic) | Verified: the requirement opened with "The critic's model tier MUST differ" and also named "or on the same model tier" as a trigger. Now: the default is cited, the rule and the trigger are those of F100-FR-024 (same model), recorded in `criticPick`, never blocking, never a launch check. An unknown model is reported as null, so that the diversity test gives `unverified` |
| W-125-02 | repair | medium | done | `spec.md:177` (edge case), `:216` (F125-FR-006), `:255` (F125-FR-012), constraint row of rulings 34 and P2, clarification on the permission mode, row 26 of the profile table; `contracts/argument-table.md` (both tables); `tasks.md:98` (T030), T080; `research.md` D-6 | One difference from the worklist: the worklist's sentence allows "user configuration, environment or flag". Ruling 34 as read by CQ-183 and row 26 of the table of feature 100 say user configuration only, and that was taken. One addition: where the consumer chose the mode and the precondition fails, the launch is refused as a configuration error (see "New questions", N-1) |
| W-125-03 | repair | medium | done | `plan.md:72`, `:73` (rows VIII, IX), `:175` (Complexity Tracking, two rows); `spec.md:264`, `:270`, `:276` (F125-FR-013 to F125-FR-015), `:348` (F125-FR-027), F125-SC-003, rows CQ-143 and CQ-145 of the table of readings; `tasks.md` T004, T014, T024, T047, T081; `data-model.md`; `quickstart.md` step 4; `research.md` D-18, D-19 | The spec changed to the reading nearest to the letter, and the rest is a recorded deviation. See "The readings of CQ-143 and CQ-145" below |
| W-125-04 | repair | medium | done | `spec.md:34`, F125-FR-020, headings G3 and G4; and every "Tier 1", "Tier 2", "Tier 3" of `spec.md`, `plan.md`, `tasks.md`, `research.md`, `quickstart.md`, `contracts/*.md` | Wider than the four places named: 72 bare uses of "Tier n" were written "auth tier n". The line **Input** of `spec.md` is a quotation and was left |
| W-115-02 | queue (pointer) | medium | done | `spec.md:343` | The worklist asks no change; F125-FR-026 now carries `assumption: CQ-191`, because it states the rule of the higher effort |
| W-127-02 | repair (pointer) | medium | done | `contracts/classifier-table.md` (both tables, and the paragraph on `retryable`); `data-model.md` (classifier entry); `spec.md` F125-FR-031 | Feature 127 had not yet stated the values in §Q.1 when this was written. The values of the worklist were taken: true for `quota_window`, `rate_limit_transient`, `overload`, `agent_failure`, `provider_other`; false for `quota_credit`, `auth`, `context_window`, `budget_cap` |
| W-X-05 | repair (pointer) | medium | done | `spec.md`, first line of "Assumptions" | The register is named without a count |
| W-X-11 | repair (pointer) | medium | done | `spec.md` F125-FR-010 (row 119), F125-FR-020 (row 120), F125-FR-022 (row 121), F125-FR-041 (row 122); the profile table ("Key", and the sentence under it); `tasks.md` T079 | Verified against annex X §X.7 rows 119 to 122 |
| W-X-14 | repair (pointer) | medium | done | `plan.md:53` to `:97` | Form of the template: the instruction line, v3.0.0 named, twenty rows with ✅, ❌ or N/A, the supporting requirement in each row that passes, the gate line, the re-check |
| W-X-15 | repair (pointer) | medium | done | `tasks.md:15`, T055, T065, T077, `:252` (Dependencies: "US4 needs T003" is now "US4 needs T011"); `plan.md` (Summary, Testing, captures); `spec.md` F125-FR-038, F125-SC-009, scenario 3 of story 6, the test of story 4; `quickstart.md` step 6 | The classifier tests replay streams written from the documented shapes; the case on the captured event is a skip with its reason |
| W-X-16 | repair (pointer) | medium | done | `contracts/terms-rows.md:3`; `tasks.md` T075; `data-model.md` (terms row); `plan.md` (source tree, `terms-rows.json`) | 147 for the terms gate and its file |
| W-X-19 | repair (pointer) | medium | done | `spec.md` F125-FR-003, F125-FR-006, F125-FR-036 (`ep:`), the table "Extension points"; `plan.md` row VI | `implements (an entry)`. The rule of W-ORC-06 is not yet in `STAGE-B-RULES.md`; the word of the worklist was taken |
| W-X-33 | repair (pointer) | low | done | `spec.md` F125-FR-006 (annex G §G.7, F100-FR-189), F125-FR-038 and F125-SC-008 (EP-02, annex C §C.1); `tasks.md` T065, T074; `contracts/README.md` | The table "Out of scope" still names the owning features; that is its purpose |

Counts: 13 items done, 0 not applied, 0 open.

## The readings of CQ-143 and CQ-145

For the alignment of feature 131.

| Question | Text of the principle | Reading of 2026-09-29 | Reading now | What remains as a deviation |
|---|---|---|---|---|
| CQ-143 | Principle VIII: "The operator's configuration is never mutated. At Tier 1 a pass uses the harness's own logged-in configuration, read-only"; "Session state lives no longer than its attempt". Ruling 36: "never written to" | The harness adapter removes the session state of its minted sessions in the real home | The harness adapter writes nothing and removes nothing in the real home. At auth tier 1 a pass persists no session state and continuation is off, with context carried through files, until capture E shows that the state can be kept outside the home. At auth tier 2 the state lives in the throwaway home and goes with it | The harness writes files of its own in the real home, so the home is not byte-identical. Row VIII is ❌ with a row in Complexity Tracking |
| CQ-145 | Principle IX: "The critic never runs on a model whose context window is not known up front. There is no default window for an unknown model" | An unlisted model falls back to 200,000 tokens | Outside `parity` no default window: an unlisted model without a declared window does not qualify and the call is refused. A window the consumer declares always wins | The fallback of 200,000 under the `parity` profile (B-0911; Principle XVIII). Row IX is ❌ with a row in Complexity Tracking |

Both readings are now the same as those of feature 131 (`specs/131-adapter-codex/spec.md`,
F131-FR-013 and F131-FR-030). Feature 131 has nothing to change in substance. Its plan marks row IX
as a pass although it keeps 128,000 under `parity`; if the orchestrator wants the two plans alike,
row IX of 131 takes the same recorded deviation.

## Requirements added or changed in place

No requirement was added. Functional requirements: 41. Success criteria: 10. Tasks: 81 (T080 and T081
appended). Named tests: 45 (CT-125-33 and CT-125-34 appended).

Changed in place, listed in `spec.md`, "Repairs after the cross-feature review": F125-FR-003,
F125-FR-006, F125-FR-010, F125-FR-012, F125-FR-013, F125-FR-014, F125-FR-015, F125-FR-020,
F125-FR-022, F125-FR-023, F125-FR-026, F125-FR-027, F125-FR-031, F125-FR-036, F125-FR-038,
F125-FR-041, F125-SC-003, F125-SC-008, F125-SC-009.

## What another feature or the orchestrator must do

| # | Who | What | Evidence |
|---|---|---|---|
| 1 | Orchestrator, feature 100 | Annex B §B.5, row `attempt:<N>:<k>:<n>:session`, says "At auth tier 1 the harness adapter removes only the state of sessions it minted" and places the state inside the configuration home. Under the nearest reading of Principle VIII no harness adapter removes anything there. Recommended: "at auth tier 1 no session state is kept in the configuration home by the run; where the harness cannot keep it elsewhere, continuation is off" | `specs/100-specstride/annexes/B-state.md:202`; F125-FR-014; F131-FR-013 |
| 2 | Orchestrator, feature 100 | F100-FR-231 says that for a configured critic on an unlisted model the harness adapter uses the smallest window of its table and warns. Features 125 and 131 now both refuse outside `parity`. Feature 100 is the compromise of CQ-145 and differs from both adapters | `specs/100-specstride/annexes/C-ports-and-edges.md:225`; F125-FR-027 |
| 3 | Orchestrator | Profile row 10 (`carry.continuation`, "on, where the harness supports it") holds, but Claude at auth tier 1 now counts as not supporting it until capture E. If the owner wants continuation at auth tier 1 by default, CQ-143 must be answered for the removal | annex X §X.7 row 10 |
| 4 | Feature 127 | State `retryable` per class in §Q.1. If the values differ from those of the worklist, `contracts/classifier-table.md` of this feature follows | W-127-02 |
| 5 | Feature 131 | Nothing in substance; see the note on row IX above | `specs/131-adapter-codex/plan.md:71` |
| 6 | Orchestrator | The traceability files give B-0911 the disposition `ported`. With the fallback kept under `parity` only, `translated` fits better. The spec keeps `ported`, because the files decide | `docs/ecosystem/traceability-items.tsv:912` |
| 7 | Orchestrator | Rows 35 and 36 of the table of feature 100 (place of conformance suites, of parity and characterization tests) do not name feature 125 as a follower. The tasks of this feature keep their tests under `packages/adapter-claude/test/`. Not changed; say so if 125 is to follow | `tasks.md`, all test tasks |
| 8 | Orchestrator | The earlier sections of `analyze-report.md` are a record of 2026-09-29 and were left | `analyze-report.md:1` to `:51` |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | The consumer set the bypass mode in user configuration and the precondition fails (no sandbox detected, or the user is root). Is the launch refused, or does the pass run in the accept-edits mode with a warning? | Ruling 34; CQ-183; F100-FR-111 (a proposer whose ceiling is C0 is refused at launch without the opt-in); R5 open question 1 | Refused as a configuration error that names the missing part; no silent change of a mode the consumer chose. The spec proceeds on this (F125-FR-012) | One sentence of F125-FR-012 and the test CT-125-33 change to a warning and the accept-edits mode |
| N-2 | Does `harnesses.claude.transport` fall under the reading of CQ-183 (user configuration only)? F125-FR-034 allows user configuration, the environment or a flag | Rulings 20, 70; CQ-183 names rulings 34 and P2 only | No: the choice of a transport is no opt-out of containment. F125-FR-034 was left | F125-FR-034, T061 and `contracts/transport-and-sdk.md` lose "the environment or a flag" |

## Register rows needed (with the text)

The checker refuses `DV-new`, so F125-FR-027 cites DV-106, the like row of feature 131. One of the
two is needed:

| Row | As-is | Intended | Source | Under `parity` |
|---|---|---|---|---|
| New row, or DV-106 widened to B-0911 | A Claude critic model that is not in the table gets a context window of 200,000 tokens (B-0911) | A model whose window is not known does not qualify as critic and gets no default window; a window the consumer declares always wins | Principle IX; decision 17; CQ-145 | Off under the `parity` profile, where the fallback applies; own test CT-125-34 |

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None: the feature has no such directory |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h; feature 125: 16 of 16 kept items |
| `CQ-pending-*` placeholders | None in the feature |
| Bare "Tier n", "same-model warning" | None left, except the quoted line **Input** of `spec.md` and the record of 2026-09-29 in `analyze-report.md` |
| Each changed requirement read again | Done; one fault of the replacement found and repaired ("A auth tier" in F125-FR-016) |
| Paid tasks | T001 to T004 and T076 are marked paid; none was run; none is a precondition of a test |
