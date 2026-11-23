# Repair report — 131-adapter-codex

Date 2026-09-30. Every item was checked against the files before a change. Line numbers are those after the repair.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-131-01 | repair | medium | done | `spec.md` F131-FR-037, F131-FR-038, F131-SC-008, User Story 5, Key Entities; `tasks.md` section "What this feature inherits", T001 to T006, T044, T050, T057, T058, T060; `contracts/captures.json`; `plan.md` Summary, Scale/Scope, row XII, Order of construction; `data-model.md`; `quickstart.md`; `research.md` decision 11 | Verified: no capture was marked. Captures 1, 2, 4 and 5 are paid (each needs a run of `exec`, which calls a model, also on a login); the worklist names 1 and 2 only. Capture 3 is not paid (the harness's own sandbox command, no model call); that its result holds under `exec` is shown by a seeded read added to the paid probe of form (a), so no further paid call arises |
| W-131-02 | repair | low | done | `plan.md` row VIII, row XVIII, argument table "Proposer under `parity`", Complexity Tracking row 2; `contracts/parity-rows.json`; `research.md` | Verified. The plan now says that the parity prompt travels as one positional argument with no bound of the adapter. Because Principle VIII asks for a bound, it is a stated deviation and not a pass |
| W-110-03 | repair | high | done | `spec.md` table of settings (two rows), clarification on the alias table | Verified: annex X §X.8 holds the row `OPENAI_BASE_URL`, `OPENAI_API_KEY` (`annexes/X-cross-layer.md:723`) |
| W-110-05 | repair | medium | done | `spec.md` F131-FR-010, F131-FR-011, table of settings, clarification; `plan.md` row VIII, table of choices; `tasks.md` T027; `research.md` decision 2 | Verified: F131-FR-010 accepted "the environment or a flag". Now user configuration only, `assumption: CQ-183` |
| W-110-09 | repair | medium | done | `spec.md` F131-FR-014, row 131 of the profile table, table of settings; `plan.md`; `tasks.md` T032; `data-model.md`; `contracts/parity-rows.json` | Key `harnesses.codex.proposerCustomisations` (generic `harnesses.<id>.proposerCustomisations`), as row 16 of the table of feature 100; memory keeps `memory.native.proposer` (row 29) |
| W-127-02 | repair | medium | done | `spec.md` F131-FR-033; `contracts/classifier-entries.json`; `plan.md`; `data-model.md`; `tasks.md` T052 | Verified: `provider_other` had no value. Values for all nine classes. §Q.1 of feature 127 has no column yet, so the source cited is annex E §E.3 (feature 100) |
| W-X-05 | repair | medium | done | `spec.md` clarification on the register | The register is named without a count |
| W-X-15 | repair | medium | done | `tasks.md` Dependencies, T006, T008, T053, T055, T057; `spec.md` F131-FR-037; `plan.md` Order of construction | "T043 needs T003" and "T001 to T005 before T006" removed; T057 states the skip |
| W-X-16 | repair | medium | done | `spec.md` table "Out of scope", Assumptions; `plan.md` "What is planned elsewhere" | Terms gate, terms data and audience: 147. Secret resolvers and key spelling: 110 |
| W-X-17 | repair | medium | done | `spec.md` F131-FR-021, new F131-FR-040, table of contracts; `tasks.md` T062, T063; `plan.md`; `data-model.md`; `quickstart.md` | The rule has the content of F124-FR-045 and F124-FR-046, stated in full and cited through F100-FR-024 and annex C §C.6, because a tier 2 feature cites feature 100 only |
| W-X-19 | repair | medium | done | `spec.md` F131-FR-006 (`ep:`), table "Extension points" | `implements (an entry)` |
| CQ-143 and CQ-145 (orchestrator's point) | repair | — | done | `spec.md` F131-FR-013, F131-FR-029, Assumptions; `plan.md` rows VIII and IX, Complexity Tracking; `research.md` decisions 9 and 10 | See "Reading of Principles VIII and IX" below |
| CQ-187, DV-117 (follow-up of feature 141) | repair | — | done | `spec.md` F131-FR-027, User Story 3, clarification, Assumptions, "As-is behaviour not carried"; `tasks.md` T046; `quickstart.md`; `checklists/requirements.md` | The note on CQ-116 is removed. CQ-116 stays only as history in the clarifications and in the analyze report of 2026-09-29 |
| Row 30 of the profile | repair | — | done | `spec.md` profile table; `contracts/parity-rows.json` | Key `harnesses.<id>.overlay`, as row 17 of the table of feature 100 |
| Package name | — | — | not applied | — | `@specstride/adapter-codex` is already the package of `package-graph.json` |

Counts: 14 done, 1 not applied, 0 open.

## Reading of Principles VIII and IX

`specs/125-adapter-claude/repair-report.md` did not exist when this repair was made. The repaired `spec.md` and `plan.md` of feature 125 were read in its place. Both adapters now take the same reading.

| Question | Reading of this feature | Remaining deviation |
|---|---|---|
| CQ-143 (Principle VIII, "the operator's configuration is never mutated") | The harness adapter writes nothing and removes nothing in the real configuration home. At auth tier 1 no session state is persisted and continuation is off, until capture 4 shows that session files can live outside the home. This was already the direction of F131-FR-013; the ban on removal and "until capture 4" were added | What the harness writes to its home by itself at auth tier 1. Complexity Tracking row 1 |
| CQ-145 (Principle IX, "no default window for an unknown model") | Outside the `parity` profile there is no default window and the model does not qualify. Unchanged in F131-FR-030 | The fallback of 128,000 under `parity` (B-0910, DV-106), which Principle XVIII asks for. Complexity Tracking row 4 |

Rows VIII and IX of the Constitution Check were marked as passed and are now deviations. Further deviations recorded there: the parity prompt as an argument without a bound; the allow-all flag and no memory flag under `parity`; the session id that the runtime cannot mint (CQ-117); the missing key scored as a failed call under `parity` (CQ-187).

## Requirements added or changed in place

| Requirement | Kind | Item |
|---|---|---|
| F131-FR-006 | changed | W-X-19 |
| F131-FR-010, F131-FR-011 | changed | W-110-05 |
| F131-FR-013 | changed | CQ-143 |
| F131-FR-014 | changed | W-110-09 |
| F131-FR-021 | changed | W-X-17 |
| F131-FR-027 | changed | CQ-187 |
| F131-FR-029 | fields added | CQ-145 |
| F131-FR-033 | changed | W-127-02 |
| F131-FR-037, F131-FR-038, F131-SC-008 | changed | W-131-01, W-X-15 |
| F131-FR-040 | added; test CT-131-40; tasks T062, T063 | W-X-17 |

Functional requirements: 40. Success criteria: 8. Tasks: 63.

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| 110 | Add `harnesses.<id>.proposerCustomisations` to the key list (`off`, `on`; default `off`; widening; owners 131, 134). It is not in `contracts/config-keys.tsv` |
| 127 | Add the column `retryable` to §Q.1 with the values of W-127-02. This feature uses: true for `quota_window`, `rate_limit_transient`, `overload`, `agent_failure`, `provider_other`; false for `quota_credit`, `auth`, `context_window`, `budget_cap` |
| 100 | Annex X §X.6 has no row for the closed set "Sources of a fact of the proof of form (a)" (`stream-first-record`, `adapter-invocation`; owner 131). Reported on 2026-09-29; still open |
| 101 | DV-117 and CQ-187: outside the `parity` profile the refusal of a missing critic credential is the rule of feature 100 and 101. This adapter reports `absent` in its preflight and raises the error if a call is reached |
| 125 | Both adapters now take the same reading of CQ-143 and CQ-145. The note of the worklist ("Feature 131 chose the other answer to both") no longer holds |
| Orchestrator | CQ-116 can be closed for feature 131: no requirement cites it. CQ-145 recommends widening DV-106 to B-0911; this feature needs no change for it |

## New questions (each with a recommended answer and its source)

None. The readings rest on queued questions: CQ-117, CQ-143, CQ-145, CQ-183, CQ-187.

One remark, not a question: the worklist marks captures 1 and 2 as paid. This feature marks 4 and 5 paid as well, because each needs a run of `exec`. If the owner holds that a capture can be made without a model call, the mark changes as data in `contracts/captures.json` and in T004 or T005.

## Register rows needed (with the text)

None. DV-106 and DV-117 exist.

## Checks

| Check | Result |
|---|---|
| Generator or check in `contracts/tools/` | None in this feature |
| JSON files of `contracts/` parse | Yes (`captures.json`, `classifier-entries.json`, `parity-rows.json`) |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED, checks a to h; feature 131: 8 of 8 items |
| Every requirement has a test task | 40 of 40 |
| Paid calls made by this repair | 0. No CLI was run |
