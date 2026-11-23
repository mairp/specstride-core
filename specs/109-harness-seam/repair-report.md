# Repair report — 109-harness-seam

Written by the repair agent of feature 109 on 2026-09-30, from the section of feature 109 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` (no item of its own; 17 pointers), the table "What the
other features must follow" of `specs/100-specstride/repair-report.md`, and section 5 of
`specs/141-parity-oracle/followup-report.md`. Paths are relative to `specs/109-harness-seam/`
unless they start with `specs/` or `docs/`. Line numbers are those of the files after the repair.

Every item was checked against the file before it was changed. No requirement id, task id or test
name was renumbered or reused. Nothing outside `specs/109-harness-seam/` was written. No model was
called, no credential was read; the baseline was read with `git show 9cab15d:specstride-lib.sh`
only.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-100-19 | repair | critical | done | `plan.md:76` (row IX, unticked, ❌), `:97` to `:101` (re-check), `:219` to `:226` (Complexity Tracking); `spec.md:399` (F109-FR-038); `research.md` D-5 | Verified: row IX was ticked and Complexity Tracking said "Nothing to justify". The row of Complexity Tracking has the wording of the worklist and names CQ-182 |
| W-100-20 | queue | critical | done | `spec.md:399` to `:403` (F109-FR-038, `assumption: CQ-182`), `:706` | The specification proceeds on the recommended answer. The requirement says what is removed if the owner answers otherwise |
| W-146-01 | repair | high | done for the side of 109 | `data-model.md:16`, `:82` to `:98`; `spec.md:315` (F109-FR-025), `:462`, `:533`; `tasks.md:364`, `:366`; `quickstart.md`; `plan.md:23` | Owner by annex B §B.20: feature 146. Field names of the owner taken. See "What another feature must do", point 1 |
| W-X-02 | repair | high | done | `plan.md:160` to `:167`, `:165` to `:172`; `tasks.md:36` to `:43`, `:55`, `:57`, `:256`, `:258`, `:356`, `:358`; `quickstart.md:17` | Suite in `packages/testkit/src/conformance/EP-02/`, sample in `packages/testkit/src/samples/EP-02/`. The descriptor-only fixture is a test of a whole run and stays in `tests/conformance/harness/descriptor-only/` |
| W-100-21 | repair | medium | done | `tasks.md:383` (T102), `:457`; `plan.md:73` (row VI) | Verified: T102 ran `python3`. It now reads the recorded result of the traceability check. See "What the orchestrator must do", point 3 |
| W-110-05 | repair | medium | done | `spec.md:322` (F109-FR-026), `:568` (settings), `:681` (clarification), `:707`; `plan.md:75`; `tasks.md:273` (T072); `research.md` D-4; `quickstart.md` (scenario 9); `contracts/parity-rows.json` | Verified: the clarification said "user configuration, the environment or a flag" and disagreed with F109-FR-026. `assumption: CQ-183` |
| W-X-05 | repair | medium | done | `spec.md:687` | Verified: the clarification said 97 rows. The register has 117 rows today and still grows, so the rows that bear on this feature are named and no count is given |
| W-X-06 | repair | medium | done | `spec.md:132` | "the next engine start" |
| W-X-07 | repair | medium | done | `plan.md:48`, `:130`, `:153`, `:165` to `:172`, `:185`; `spec.md:590` to `:604`; `contracts/closed-sets.json`; `contracts/README.md` | Owners of `@specstride/harness`: 109, 124, 126, 146 (verified in the package graph). Found beside the places named: the nine closed sets "to be added" are rows 123 to 131 of annex X §X.6; the assumption texts of CQ-064 state what annex C §C.16 and row 129 hold today |
| W-X-10 | repair | medium | done | `spec.md:308` (F109-FR-023), `:456`, `:522`, `:705`; `data-model.md:11`; `plan.md:42` | `package:harness:<id>`, annex B §B.5 (verified at `specs/100-specstride/annexes/B-state.md:250`). The assumption CQ-065 is removed from the requirement |
| W-X-14 | repair | medium | done | `plan.md:71` | Heading "The product and its edges (VI–XII)" added; twenty rows, each with ✅, ❌ or N/A |
| W-X-16 | repair | medium | done | `spec.md:40` to `:41`, `:694`; `plan.md:199` to `:201` | Terms gate, terms data and audience: 147. Secret resolvers and key spelling: 110. One more place than the worklist names (the table "Out of scope") |
| W-X-19 | repair | medium | done | `spec.md:313` (F109-FR-024, `ep:`), `:510` | `implements (an entry)`. The item depends on W-ORC-06; `STAGE-B-RULES.md` does not state the rule yet. The word of the worklist was taken |
| W-X-22 | repair | medium | done | `spec.md:710` to `:723` | The worklist names T-14. Annex X §X.9 names feature 109 for seven threats; all seven are in the table: T-07, T-13, T-14, T-15, T-16, T-34, T-48 |
| W-X-27 | repair | medium | done | `plan.md:40`; `research.md` D-9 | The validator by reference to D-2 of feature 100. The YAML parser: see "Found while repairing", point 1 |
| W-100-16 | repair | low | done | `contracts/overlay-marker.schema.json:3`, `:5`; `contracts/README.md` | `urn:specstride:schema:specstride-overlay/v1:marker`: the form for a part of a record, since feature 100 holds `urn:specstride:schema:specstride-overlay/v1` itself (`specs/100-specstride/contracts/schemas/overlay.schema.json:3`) |
| W-X-29 | repair | low | done | `plan.md:93` (row XIX); `tasks.md:399` (T108, test CT-109-110) | 200 bytes per doctor finding; 200 bytes per line and 4,096 bytes per harness for `harness verify`. Starting values; measured with the helper of T194 of feature 100 |
| Table of feature 100, row 17 | follow | — | done | `spec.md:559`, `:565`; `contracts/parity-rows.json` | Profile row 30 has the key `harnesses.<id>.overlay` |
| Table of feature 100, row 26 | follow | — | done | As W-110-05 | — |
| Table of feature 100, rows 23, 24, 38 | follow | — | not applied | — | Nothing to change: `grep` finds no "same-model warning", no "iteration" as a counted unit and no "engine invocation" in this feature |
| Follow-up of 141: `help-list-unavailable` | follow | — | done | `spec.md:173`, `:179` to `:181`, `:223` to `:225` (F109-FR-006), `:635`; `tasks.md:59` (T006), `:131` (T028), `:396` (T107); `plan.md:44`, `:190`; `research.md` D-10; `contracts/traceability.json` | Verified in the baseline: the line is printed when the registry query gives no output. Characterization test CT-109-109. The parity test PT-109-C-021-list-unavailable is withdrawn |
| Follow-up of 141: `root-sandbox-assertion` | follow | — | done | `spec.md:172`; `tasks.md:59` (T006), `:277` to `:282` (T074, `prerequisite:`), `:458`; `plan.md:44`, `:87` (row XVII); `quickstart.md` | Effective user id 0, else a skip with its reason; a skip blocks a release |
| `CQ-pending-*` placeholders | — | — | not applied | — | The feature holds none (`grep`) |

Counts: 22 done (17 pointers of the worklist, 2 rows of the table of feature 100, 2 points of the
follow-up of feature 141; W-146-01 counted as done for the side of this feature), 2 not applied,
0 open.

## Requirements added or changed in place

Added: none. The feature has 44 functional requirements, 7 success criteria and 108 tasks
(106 before; T107 and T108 appended).

| Requirement | Item | What changed |
|---|---|---|
| F109-FR-006 | Follow-up of 141; CQ-193 | `test:` gains CT-109-109; `assumption: CQ-193` |
| F109-FR-023 | W-X-10 | Cites `package:harness:<id>`; the assumption CQ-065 is removed |
| F109-FR-024 | W-X-19 | `ep:` EP-14 `implements (an entry)` |
| F109-FR-025 | W-146-01 | The stored result is the record `specstride.harness-verify/1` with the eight field names of the owner |
| F109-FR-026 | W-110-05 | The opt-in to C0 from user configuration only; `assumption: CQ-183` |
| F109-FR-032, F109-FR-036 | W-X-07 | Text of the assumption CQ-064 only |
| F109-FR-038 | W-100-19, W-100-20 | Recorded deviation from Principle IX, recorded for every call; `assumption: CQ-182` |

Tests added: CT-109-109 (characterization, T107), CT-109-110 (bytes of host-facing output, T108).
Test withdrawn: PT-109-C-021-list-unavailable (the name is not used again).

## What another feature or the orchestrator must do

| # | Who | What | Why |
|---|---|---|---|
| 1 | 146 | Fix the field list of `specstride.harness-verify/1` in its `data-model.md:30` to `:40` and in `contracts/schemas/harness-verify-result.schema.json` as W-146-01 says: `schema`, `harness`, `version`, `descriptorHash`, `at`, `outcome`, `cases`, `budget`, with `schema` required and `$id` `urn:specstride:schema:specstride.harness-verify/1`; drop the sentence "Feature 100 gives the logical name and no schema" | Feature 146 had not been repaired when this report was written: its files hold five fields (`harness`, `version`, `descriptorHash`, `at`, `outcome`) and no `schema`, `cases` or `budget`. Feature 109 changed four names (`id` to `harness`, `harnessVersion` to `version`, `date` to `at`, `result` to `outcome`) and kept `schema`, `descriptorHash`, `cases`, `budget`. Feature 146 changed nothing so far. If 146 does not take `cases` and `budget`, feature 109 writes two fields the owner does not list |
| 2 | Orchestrator | Correct row B-0356 of `docs/ecosystem/traceability-items.tsv` (and cluster C-021 in `traceability.md`): proof `CT-109-109`, a characterization test, in place of `FX-26; PT-109-C-021-*` | Feature 141 refused the scenario; F109-FR-006 keeps the old name in `test:` beside the new one until the row is corrected, then `PT-109-C-021-*` leaves the field, `spec.md:635` and `contracts/traceability.json` |
| 3 | Orchestrator, or feature 100 | Name the file in which the result of the traceability check is recorded, so that a test of the product can read it | W-100-21 asks that T102 reads "the result of the traceability check"; no feature names such a file. T102 treats a missing result as a skip, and a skip blocks a release |
| 4 | Orchestrator, 141 | The release runner needs a run with the effective user id 0 for `FX-26/root-sandbox-assertion` (capture of the reference and run of the port), or the release is blocked by the skip | F141-FR-037; B-0067 and B-0497 have no other proof |
| 5 | Orchestrator | State the rule of W-ORC-06 in `STAGE-B-RULES.md` (`implements (an entry)`) | W-X-19 was applied before the rule was written |
| 6 | 110 | Keys for the time limits of the operations of the harness port (`detect`, `capabilities`, `preflight`, `stop`); the key list holds none. The value `C0` of `sandbox.level` gets the layer `U` only (W-110-05, its own item) | F109-FR-003 says the limits are configuration; `plan.md:188` gives starting values |
| 7 | 110 or 100 | Say through which port a package of layer L1 receives a parsed YAML file | See "Found while repairing", point 1 |
| 8 | Orchestrator | CQ-064 can be marked as applied: annex C §C.16 holds `ownerPid`, `ownerStart`, `createdAt`, and annex X §X.6 row 129 holds the scope word `critic` | The queue still says "open" |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | Descriptors are YAML files. Research D-8 of feature 100 makes the YAML parser a dependency of the configuration loader of feature 110 only, and `@specstride/harness` may import `contracts` and `kernel` only. How does the harness layer read `user:harness:<id>` and `package:harness:<id>`? | `specs/100-specstride/research.md` D-8; `specs/100-specstride/contracts/data/package-graph.json`; W-X-27 | Through a port: the CLI hands the parsed value to the descriptor loader at process start; the harness package names no parser. The plan proceeds on this | If the harness package may import the loader of 110, the package graph gains one permitted import |
| N-2 | May a test with the prerequisite "effective user id 0" run in the hermetic tier of the build, or only at the release check? | F141-FR-037; `specs/141-parity-oracle/spec.md:314` | Only where the runner is root: a skip in the build of a developer, a required run at the release check | If the build must never skip it, the build needs a container that runs as root |

## Register rows needed (with the text)

None.

## Found while repairing, not changed

| # | Finding | Evidence | Recommended |
|---|---|---|---|
| 1 | The plan had to say how a package of layer L1 reads YAML without a parser of its own; no contract of feature 100 names the port | `plan.md:40` | Question N-1 |
| 2 | Annex C §C.16 of feature 100 gives the field `scope` of the overlay schema the members `none`, `pass`, `attempt` (row 88), while the marker holds `pass`, `attempt`, `critic` (row 129). One field has two sets, by where it stands | `specs/100-specstride/annexes/C-ports-and-edges.md:911`; annex X §X.6 rows 88, 129 | One sentence in §C.16: in the marker the field `scope` is a member of row 129 |
| 3 | `checklists/requirements.md` is a record of the first step and was not rewritten | — | Leave as a record |
| 4 | F109-FR-022 lets the proposer keep native memory "unless the consumer opted in in user configuration". CQ-183 names rulings 34 and P2 only, so the requirement was not changed | `spec.md:296` | Leave; it already says user configuration |

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | The feature has none. The four JSON files that were changed parse, and were written in their former layout |
| `python3 docs/ecosystem/check-traceability.py --require-all` | `PASSED: checks a to h`, 41 of 41 features; row of feature 109: 94 assigned, 75 kept. A first run during the repair failed on checks d and f (register rows DV-114 to DV-117; row C-154.b); none of the lines named feature 109, and the later runs passed after the orchestrator's files had changed |
| `grep` for `CQ-pending`, `harness-conformance`, `tests/conformance/harness/sample`, "same-model", "engine invocation" in the feature | No hit |
| `analyze-report.md` | Section "After the cross-feature review" appended, with the consistency pass |
| Requirements above 45 | No: 44 |
