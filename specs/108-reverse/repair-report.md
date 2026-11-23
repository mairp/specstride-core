# Repair report — 108-reverse

Written by the repair agent of feature 108 on 2026-09-30, from section 2 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` ("Feature 108 — 108-reverse" and its list
"Items owned elsewhere that change files of feature 108"). All paths are relative to
`specs/108-reverse/` unless they start with `specs/` or `docs/`. Line numbers are those of the
files after the repair.

A previous agent of this feature was cut off and left one commit (`80394a0`) that had already
repaired `spec.md` for W-108-01, W-X-06, W-X-10, W-X-20 (the `test:` lines), W-X-25, W-100-04 and
W-X-33. Every one of those changes was verified against the worklist and the files before it was
accepted; nothing was redone. This session repaired the remaining places: the `tasks.md` side of
W-X-20, the schemas of W-100-16, `research.md` of W-X-30 and `data-model.md` of W-X-06.

Every item was checked against the file before it was changed. Nothing was renumbered. No
generated file was edited by hand. Feature 108 has no generator or check of its own in
`contracts/tools/`; nothing to run there.

## Result of the checks

| Check | Result |
|---|---|
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h |

## Counts

| State | Items |
|---|---|
| done | 9: W-108-01 (own), W-100-04, W-X-06, W-X-10, W-X-20, W-X-25, W-100-16, W-X-30, W-X-33 |
| not applied | 1: W-X-34 (class `accept`; the worklist says "No change". The sentences with the old ids of the split in `analyze-report.md:3` and `:9` stand as a record) |
| open | 0 |

| Requirement or place | Item | What changed |
|---|---|---|
| F108-FR-009 (`spec.md:155`), "Clarifications" (`spec.md:521`) | W-108-01 | Done by the earlier partial commit, verified: detached, a held lock ends with the handshake outcome of annex F §F.3 — `attached` (exit 4) when a live run holds the lock, `refused` with exit 24 for `lock-conflict` and `lock-unknown`, `refused` with exit 4 for every other refusal of the launch. Authority checked: `specs/122-detached-runtime/spec.md:241`, `specs/122-detached-runtime/contracts/cli-state-commands.md:20` to `:30`, `specs/100-specstride/annexes/F-runtime-root.md` §F.3 |
| "Rows of the `parity` profile" (`spec.md:506`) | W-100-04 | Done by the earlier partial commit, verified: the row of `loop.gitCommits` has "none; not a switch of this feature" in the column of §X.7; feature 100's annex X row 30 and 34 were corrected first (`specs/100-specstride/repair-report.md`, W-100-04) |
| F108-FR-003, F108-FR-007, F108-FR-008, F108-FR-009 | W-X-06 | Done by the earlier partial commit for `spec.md`; this session added the one place the commit had missed: `data-model.md:27`, state `launched`, "The engine start happened" |
| F108-FR-007 (`spec.md:141`), "Contracts of feature 100 used" (`spec.md:462` to `:470`), F108-FR-015, F108-FR-019, F108-FR-022 | W-X-10 | Done by the earlier partial commit, verified against annex B §B.5: the rows `reverse:<slug>:claims:<unit-key>`, `:test-plan` and `:scaffolds` exist (`specs/100-specstride/annexes/B-state.md:255` to `:257`); no sentence calls a name "proposed" or "missing" |
| `tasks.md` T005 to T008, T010, T020, T021, T024; new T031 | W-X-20 | This session, the `tasks.md` side: every one of the 59 test names of the `test:` lines of the kept requirements (F108-FR-001 to F108-FR-034, F108-SC-001, SC-004, SC-006) is now named in the task that runs it; the task name `PT-108-028FR026-guard` of T021 is written `PT-108-028FR026-guard-walk`, as the `test:` line of F108-FR-027 says; T031 (characterization test CT-108-161) appended for the test that had no task. The names that appear in `spec.md` only inside the table "Requirements moved to 140-reverse-inventory-and-lint" are old ids of the split and belong to feature 140; they were not given tasks here |
| F108-FR-015 (`spec.md:196`), F108-FR-024 (`spec.md:247`) | W-X-25 | Done by the earlier partial commit, verified: `out` is the location of `reverse:<slug>:output` and the output directory is that state, proposer the only writer; the row exists at `B-state.md:238` |
| `contracts/plan-output.schema.json:3`, `contracts/verification-commands.schema.json:3` | W-100-16 | This session: `$id` written as `urn:specstride:schema:internal:108:reverse-plan/1` and `urn:specstride:schema:internal:108:reverse-verification-commands/1`. The rule of `specs/100-specstride/contracts/README.md` ("The `$id` of a schema file") gives the contract form for an id of an annex; the two schema ids of this feature are in no annex, so the internal form applies |
| `research.md:11` | W-X-30 | This session: "the Specstride baseline at `9cab15d`, `lib/reverse.py`", without a machine path. No Lisa baseline and no other machine path remains in the five artifacts |
| F108-SC-006 (`spec.md:411`) | W-X-33 | Done by the earlier partial commit, verified: the budget is cited as annex G §G.5 (F100-FR-187); feature 113 is no longer named in the requirement line. The "Out of scope" table (`spec.md:24` to `:31`) keeps its owner pointers, which the analyze report accepts (S5) |
| `analyze-report.md:3`, `:9` | W-X-34 | Not applied: class `accept`, the worklist says "No change" |

## Requirements added or changed in place

None added; none changed in place by this session. The changes in place of the earlier partial
commit (F108-FR-004, F108-FR-007, F108-FR-009, F108-FR-015, F108-FR-019, F108-FR-022,
F108-FR-024, F108-FR-025, F108-FR-026, F108-FR-027, F108-SC-006) are listed in the section
"Repairs after the cross-feature review" of `spec.md` (dated 2026-09-30), which this session
extended with the rows of the changes above. The count stands at 34 functional requirements and
3 success criteria; tasks went from 30 to 31.

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| The orchestrator | Commit the changes of this session. No new register row and no new queue row is needed |
| Feature 140 | Owns the tests whose old `PT-108-*` names stand in the table "Requirements moved to 140-reverse-inventory-and-lint" of `spec.md`; each must be named in a task of feature 140 (the same fault as W-X-20, on the other side of the split) |
| Feature 122 | Nothing; F108-FR-009 now agrees with its `spec.md:241` and `contracts/cli-state-commands.md` |
| Feature 141 | The register row DV-116 says "To be confirmed by feature 141"; F108-FR-027 consumes it |

## New questions (each with a recommended answer and its source)

None. The open readings of the feature (CQ-090 to CQ-093) are older and are recorded in
`spec.md`; CQ-093 was answered by the annex on 2026-09-30, as the worklist's close-queue item
W-ORC-14 says.

## Register rows needed (with the text)

None beyond DV-116, which the orchestrator has already written (worklist section 3,
`W-ORC-03`; `docs/ecosystem/PROGRESS.md`: "register rows DV-114 to DV-117 written").

## Checks

| Check | Result |
|---|---|
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h; feature 108 carries 158 kept items, all placed |
| Test-name equality of `spec.md` and `tasks.md` | Every test name of a `test:` line of a kept requirement appears in a task; no task names a test of another feature |
| Requirement without a task; task without a requirement | None found in the places touched |
| Term pass | No "engine invocation" remains in `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `quickstart.md`, `research.md` |
| `$id` pass | Both schema files carry `$id` in the form of `contracts/README.md` of feature 100 |
| Machine paths and the machine-specific backend | No machine path and no backend name in any file of the feature |
