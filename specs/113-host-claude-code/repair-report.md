# Repair report — 113-host-claude-code

Dated 2026-09-30. Rules: `docs/ecosystem/STAGE-B-REPAIR-PROMPT.md`. Worklist: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section "Feature 113". Every item was checked against the files before a change. Line numbers are those after the repair.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-113-01 | queue | critical | done, on the recommended answer of CQ-188 | `spec.md`: User Story 5, G4 (F113-FR-037 to F113-FR-041), F113-SC-001, F113-SC-002, Clarifications of 2026-09-30; `plan.md`: Summary, Primary Dependencies, Testing, row XII, design points "Evals" and "Log of paid tasks"; `tasks.md`: T001, T017, T027 to T031, T033 to T035, T037; `research.md` row "Evals"; `data-model.md`; `quickstart.md`; `contracts/host-package.md` | Verified: F113-FR-038 said "MUST gate each pull request", F113-FR-040 named a nightly and a weekly paid run, row XII was marked as passed. One departure from the worklist: T027 and T031 are not marked PAID. T027 writes the case files and calls nothing; T031 now runs only the seven checks. The paid run of the suite is the new task T037. T029 is PAID. T001 was a paid probe already and is now marked PAID; it is no longer "first task" and T017 no longer waits for it |
| W-113-02 | repair | medium | done | `plan.md` row I, Storage, design point "Host hooks"; `spec.md` F113-FR-016, F113-FR-021; `data-model.md` row "Host marker"; `research.md` | Verified. Annex B §B.5 holds no logical name for state in the data directory of a host (its places are `user`, `control`, `workspace`, `worker-root`, `temp`, `package`, `harness-home`). None was invented (F100-FR-053). The statement of the worklist was written |
| W-113-03 | repair | low | done | `spec.md` (23 places), `plan.md`, `tasks.md`, `research.md`, `analyze-report.md` | "host hook" everywhere. The literals `hooks` (capability) and `renderStatusHooks` are unchanged |
| W-X-02 | repair | high | done | `plan.md`, source tree and Structure Decision; `tasks.md` Paths, T024 | Suite in `packages/testkit/src/conformance/EP-01/`, sample in `packages/testkit/src/samples/EP-01/`. Parity and characterization tests moved to `tests/parity/113/` and `tests/characterization/113/` (row 36 of the table of feature 100) |
| W-119-01 | repair | medium | done (re-check B-8.7, 2026-09-30) | `plan.md` Project Type; `tasks.md` T021 | Feature 119's bundling task is T064 of `specs/119-front-door-and-presenter/tasks.md`; both places cite it |
| W-X-14 | repair | medium | done | `plan.md` Constitution Check and Complexity Tracking | Form of the template: gate line, v3.0.0, a mark, a reason and a requirement per row; the section Complexity Tracking exists and is empty, because no row is a violation on the recommended answer of CQ-188 |
| W-X-16 | repair | medium | done | `spec.md` F113-FR-016 (`parity:`), "Rows of the `parity` profile" | Row 34 is owned by 147 |
| W-X-22 | repair | medium | done | `spec.md` section "Threats"; F113-FR-042; `research.md` | The worklist names T-11, T-43, T-44, T-45. Annex X §X.9 names feature 113 as an owner of seven threats (T-09, T-11, T-12, T-43, T-44, T-45, T-46); all seven are in the table. T-10, which `research.md` named, is not of this feature and was removed there |
| W-X-25 | repair | medium | done | `spec.md` F113-FR-021, F113-FR-024, "Contracts of feature 100 used"; `plan.md` Storage; `tasks.md` T016 | `workspace:current:status-line`; also `inbox:host-events:<launchId>`. The plan said the shim reads `run:<runId>:status-line` directly; corrected |
| W-112-01 | repair | low | not applied (no change asked for) | `plan.md` design point "Skill body size" (one sentence added) | See "What another feature or the orchestrator must do", point 3 |
| W-X-31 | repair | low | done | `spec.md` User Story 4, F113-FR-037, F113-SC-001, F113-SC-003, closed set row, one clarification; `plan.md`; `tasks.md` T025, T031, T032; `research.md`; `data-model.md`; `quickstart.md` | "check" for a check of the build. The directory `tests/ci-gates/` of the plan is now `tests/ci-checks/` |
| W-X-32 | repair | low | done | `spec.md` F113-FR-020 | "a start of the runtime platform" |
| Follow F100-FR-236 (table of feature 100, row 31) | repair | medium | done | `spec.md` F113-FR-042; `tasks.md` T036, T038 | The host package cites F100-FR-236 and adds no second attestation |
| Package name (W-X-01) | repair | high | done | `plan.md` Project Type; `tasks.md` T002 | `@specstride/host-claude-code`, layer L7; "(name proposed)" removed |

## Requirements added or changed in place

| Id | Kind | Item | What |
|---|---|---|---|
| F113-FR-016 | changed | W-113-02; W-X-16 | The marker is state of the host; owner of row 34 is 147 |
| F113-FR-017, -018, -022, -023, -025, -026, -027, -031, -033 | changed | W-113-03 | "host hook"; no change of meaning |
| F113-FR-020 | changed | W-113-03; W-X-32 | "host hook"; "a start of the runtime platform" |
| F113-FR-021 | changed | W-X-25; W-113-02 | Logical name `workspace:current:status-line`; marker of the host |
| F113-FR-024 | changed | W-113-03; W-X-25 | Logical name `inbox:host-events:<launchId>` |
| F113-FR-037 | changed | W-X-31; W-113-01 | "checks"; none calls a model; status names the inferred fact of the host cross-check |
| F113-FR-038 | changed, `assumption: CQ-188` | W-113-01 | A paid task of a person, logged; a release check that reads the log; no check of a pull request |
| F113-FR-039 | changed, `assumption: CQ-188` | W-113-01 | The model comes from the configuration of the run; no model id in a suite file, test, check or rule |
| F113-FR-040 | changed, `assumption: CQ-188` | W-113-01 | No nightly and no weekly job; two paid tasks of a person |
| F113-FR-041 | added, `assumption: CQ-188`, test CT-113-141 (T034) | W-113-01 | What the per-change build checks without a model call |
| F113-FR-042 | added, test CT-113-142 (T038) | W-X-22; W-100-17 | Publishing under F100-FR-236; exact package and version |
| F113-SC-001, F113-SC-002, F113-SC-003 | changed | W-113-01; W-X-31 | 0 model calls in the per-change build; the suite measured in a logged paid run |

Counts: 42 functional requirements (40 before), 5 success criteria, 38 tasks (32 before). No id was renumbered or reused. No `CQ-pending-*` placeholder existed in this feature.

## What another feature or the orchestrator must do

1. **Feature 100, annex H §H.1, "Caller and time"**: the sentence "The build calls the eval driver" does not hold with the recommended answer of CQ-188 for a driver that calls a model. Proposed text: "The build calls the eval driver on a stub of the host's suite runner; a run on the host's own runner calls a model and is started by a person." Not edited by this feature.
2. **Feature 100, annex B §B.5**: no logical name and no place exists for state that a host package keeps in the data directory of the host (the two markers). This feature states the markers as state of the host, which changes no contract. If the orchestrator wants a name, annex B needs a further place (for example `host-data`) and two names; the row of `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md` would be added.
3. **Doctor skill body, features 112 and 100**: neither feature 100 (annex G §G.5) nor the brief of 113 gives a figure for the body; both give only the total of the doctor skill, 1,500 tokens. The only source of a body figure is the allocation of R17: 800 tokens (2,240 bytes). This feature keeps 800 as the upper limit. "About 700" in `specs/112-doctor/spec.md:395` is the figure to which feature 112 trims the body so that body and worst-case output fit the total; it lies inside the limit of 800 and the two do not contradict. Feature 112 should write "at most 800 tokens, trimmed to about 700" or cite R17.
4. **Feature 119**: done on 2026-09-30 (re-check B-8.7): its bundling task T064 is cited in `plan.md` (Project Type) and `tasks.md` (T021) of this feature.
5. **`docs/ecosystem/STAGE-B-F100-AMENDMENTS.md`, line 82**: the proposed closed set is now named "Checks of the context-cost CI", not "gates".
6. **`docs/ecosystem/feature-briefs.md`, brief 113 heading 4**: "a free-grader suite per pull request with pinned models" differs from the spec while CQ-188 stands on its recommended answer.
7. **CQ-188 answered otherwise**: F113-FR-038 to F113-FR-041 return to the build, row XII of `plan.md` becomes a deviation with a row in Complexity Tracking, and T029 and T037 stay PAID.
8. The gaps of feature 100 of the first analyze report (no command that evaluates the launch checks without launching; no command that writes a `host-event` request; no marker of a child of a run) stand. They were not part of this worklist.

## New questions (each with a recommended answer and its source)

| # | Question | Sources looked at | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| 1 | From where does a run of the trigger suite take its model: a key of the product configuration, or the configuration of the run? | Principle XII ("Model ids are configuration"); annex X §X.7 (no row for evals); `specs/110-config-and-terms/contracts/config-keys.tsv` (no key for evals); CQ-188 | The configuration of the run, given by the person who starts it, recorded in the log. No product key: the suite is a tool of development and is never shipped. (This feature's own reading; no report recommends an answer) | Feature 110 adds a key, annex X §X.7 a row with its value under `parity`, and F113-FR-039 names the key |
| 2 | Is a logged paid run of the trigger suite a precondition of a release (F113-FR-038), or is the suite only advice? | CQ-188 (recommended answer: "a release check"); Principle XII ("No gate or workflow requires another person's review, account or action") | A precondition, read from the log. The person is the maintainer who makes the release, under the own login, so no third party is in the loop. (Reading of this feature from the text of CQ-188) | The release check of T035 is removed, and F113-FR-038 keeps only the paid task and its log |

## Register rows needed (with the text)

None. No `DV-new-<n>` was written.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None exists in this feature |
| `python3 docs/ecosystem/check-traceability.py --require-all` | Passed ("PASSED: checks a to h"; feature 113: 27 items, 7 kept). One run in between failed with 7 errors of check d (register rows DV-114 to DV-117 "beyond the 113 rows expected"), while the checker and the register were being changed by others (`git status` showed both modified). None named feature 113; the next run passed |
| Bare "hook" | None left outside the literals `hooks` and `renderStatusHooks` |
| "gate" for a check of the build | None left; the two uses in the table of repairs quote the old word |
| `CQ-pending-*` | None in this feature |
| Paid tasks | T001, T029, T037 marked PAID; none was run; no test depends on one |
| Size | 42 requirements, under 45; no split |
| Rules | Only files inside `specs/113-host-claude-code/` were written; no git command that changes the repository; no subagent; no model call; no CLI beyond the checker |

## Repairs of the second analyze pass (2026-09-30)

Read-only pass of `/speckit-analyze` after the cross-feature review; the repairs were applied on the explicit approval of the user given with the request. Every item was checked against the files before a change.

| # | Finding | Severity | State | Files and places changed | Note |
|---|---|---|---|---|---|
| A9-I1 | "Contracts of feature 100 used" lacked annex F §F.3 (launch outcomes, cited by the unverified check of F113-FR-003) and annex F §F.4 (`relaunch.owner`, cited by F113-FR-013 and F113-SC-004); the fixtures row lacked FX-35, which T015, T019, T024 and T026 cite | medium | done | `spec.md`: two rows added to the contracts table; the fixtures row now names FX-36, FX-32 and FX-35 | Verified against `specs/100-specstride/annexes/F-runtime-root.md` (§F.3 Handshake, F100-FR-160; §F.4) and the catalogue of feature 141 (FX-35 "Launcher and pipeline runtime") |
| A9-C1 | T001, the live-capture task, named seven requirements; four whose `status: unverified` checks need a live host had no capture task (F113-FR-016, F113-FR-028, F113-FR-030, F113-FR-039), so their statuses could never lift | medium | done | `tasks.md` T001: description gains "the npm source and the version rule of a plugin entry, the first audience notice, the six capabilities of the host, a run ended by a usage limit"; the `verifies the facts of` list gains the four ids | T001 stays a precondition of no test and of no other task |
| A9-I2 | `plan.md` said "8 kept behaviour items"; the spec carries 7 (B-2661 to B-2664, B-2666 to B-2668; B-2665 not carried), as the traceability checker also reports | low | done | `plan.md` Scale/Scope: "7 kept behaviour items in 2 clusters received (B-2661 to B-2664, B-2666 to B-2668; B-2665 not carried)" | |
| A9-I3 | The priority line of User Story 2 omitted the `relaunch.owner` `root` condition that F113-FR-013 and F113-SC-004 carry | low | done | `spec.md` User Story 2 | |
| A9-U2 | The 500-line limit of a skill body (F113-FR-036) was named in no design point and in no task wording; only bytes were | low | done | `plan.md` design point "Skill body size"; `tasks.md` T025 | |
| A9-U1 | `plan.md` lists `checklists/requirements.md`; the directory `checklists/` is empty | low | open (not applied) | — | Left to the checklist workflow; the plan line records the intent. Run the checklist skill or drop the line |

Counts after this pass: 42 functional requirements, 5 success criteria, 38 tasks; no id was renumbered or reused; no requirement text changed except the priority line of User Story 2.
