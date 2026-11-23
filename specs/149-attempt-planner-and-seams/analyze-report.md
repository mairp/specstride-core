# Specification Analysis Report: Attempt planner and seams (feature 149)

**Date**: 2026-09-29. **Artifacts**: spec.md, plan.md, tasks.md, with research.md, data-model.md,
contracts/ and quickstart.md. **Constitution**: v3.0.0.

Two runs. The first found U1, which was repaired in data-model.md, tasks.md and
contracts/ep18-seams.md. The second found nothing new. What stays open is reported to the
orchestrator.

The coverage check `docs/ecosystem/check-traceability.py` does not know this feature until the
orchestrator has added it. This feature carries no as-is id, so it has no row to check: a script
of its own showed that no `origin:` and no `proves:` of this feature names an as-is id.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| U1 | Underspecification | MEDIUM | tasks.md T024; data-model.md; spec.md F149-FR-002 | The planner of the recovery cycle needs to know whether an accelerated phase attempt is due. The rule for it belongs to the other part of the split, which this feature may not cite | Repaired: the history carries the two facts `diagnosisMade` and `accelerationDue`; the planner reads them and works out nothing again |
| G1 | Gap in feature 100 | MEDIUM | spec.md F149-FR-002; feature 100 annex E §E.1 "Inputs" of `next` | The inputs of `next` name verdicts, signatures and counts. They do not name the two facts of U1, through which the two parts of the split meet | Open: reported |
| G2 | Gap in feature 100 | LOW | spec.md F149-FR-006; F100-FR-204 | The list of users of the table evaluator does not name the bump table | Open: reported |
| G3 | Gap in feature 100 | LOW | spec.md "Rows of the `parity` profile" | No row of annex X §X.7 for K (`attempt.tier_bump_after`) | Open: reported |
| G4 | Ownership | LOW | spec.md F149-FR-008; annex X §X.7 row 32 | Row 32 names 115 as owner of the switch of the comparison at phase entry; this feature performs the comparison and reads the switch | Open: reported |
| G5 | Gap in feature 100 | LOW | spec.md "Closed sets" | Two closed sets of this feature have no row in annex X §X.6; row 9 names 101 as owner and now belongs to 149 | Open: reported |
| G6 | Gap in feature 100 | LOW | spec.md F149-FR-001; annex E §E.1 | The call function through which a strategy makes a call is not named in annex E §E.1, which states only the guarantees it serves | Open: reported |
| U2 | Underspecification | LOW | spec.md F149-FR-003 | No source gives the default of K | Open: CQ-175; proceeds on 2 |
| A1 | Ambiguity | LOW | plan.md Performance Goals | The time value is a starting value with low confidence | Accepted: no requirement rests on it |
| F1 | Wording against the split proposal | LOW | spec.md F149-FR-001, -002, -003, -005, -006 | Five requirements gained sentences that the old ones did not have: the call function, the order of the planners, which rung is "the next", where the state of a quota comes from, an invalid table. Each comes from the clarifications or from the contracts of the feature before the split | Accepted: recorded under "Clarifications" |

No finding is CRITICAL or HIGH. No duplication was found.

## Coverage Summary

| Requirement | Has task? | Task ids | Notes |
|---|---|---|---|
| F149-FR-001 | Yes | T006, T008, T009, T010 | |
| F149-FR-002 | Yes | T005, T006, T018, T023, T024 | |
| F149-FR-003 | Yes | T019, T025 | |
| F149-FR-004 | Yes | T020, T025, T026 | |
| F149-FR-005 | Yes | T021, T026 | |
| F149-FR-006 | Yes | T022, T025, T027 | |
| F149-FR-007 | Yes | T007, T011, T014, T015 | |
| F149-FR-008 | Yes | T012, T016 | |
| F149-FR-009 | Yes | T013, T017 | |
| F149-FR-010 | Yes | T028, T029, T030 | |
| F149-SC-001 | Yes | T008 | |
| F149-SC-002 | Yes | T011 | |
| F149-SC-003 | Yes | T019 | |
| F149-SC-004 | Yes | T028 | |

Every test the spec names (CT-149-1 to CT-149-10) has a task, and every test task names a test
of the spec.

## Citations of the other part of the split

The ids of the first part appear only in the table "Ids before the split", which the split
asks for. No requirement, task or contract of this feature names a requirement or a test of the
first part.

## Constitution Alignment

No issue. The plan answers all twenty gates; none is ❌.

## Unmapped Tasks

None that lacks a requirement. T001 to T004 and T031 to T033 are set-up and review tasks.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 10 |
| Success criteria | 4 |
| Tasks | 33 |
| Tasks with `proves:` | 10 |
| Requirements with at least one task | 14 of 14 (100 per cent) |
| As-is ids carried | 0 |
| Ambiguities | 1 (A1) |
| Duplications | 0 |
| Critical issues | 0 |
| Findings repaired | 1 |
| Findings open, reported | 7 |

## Next Actions

- No CRITICAL finding. The feature can go to implementation.
- G1 is the one point where the two parts of the split need feature 100 to carry something it does not hold yet.
- If CQ-175 is answered otherwise, one default changes in F149-FR-003 and in the golden decisions of T022.

## After the cross-feature review

2026-09-30. Repairs of act B-8.6c from `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. The feature has
no item of its own; three pointer items were worked (W-X-09, W-X-18, W-X-28), and one note from the
repaired feature 101 on F149-FR-001. Details in `repair-report.md`.

What changed:

- W-X-18: F149-FR-009 gained `ep: EP-05 `specstride.check-runner/1` (consumes)`, so the section
  "Extension points" is no longer the only place that names EP-05.
- W-X-28: every path `tests/own/149/` became `tests/characterization/149/` (plan.md, tasks.md). The
  feature has no parity test, so `tests/parity/149/` is stated in the plan but unused.
- W-X-09: task T034 added to Phase 7 (macOS runner when it exists; skips with their reasons); row
  XVII of the Constitution Check now answers as a pass and cites T034.
- Note of feature 101: F149-FR-001, its acceptance scenario 2, T008, quickstart.md and
  data-model.md now say "critic-diversity warning", raised for the results `same-model` and
  `unverified` of the diversity test. The field name `sameModelWarning` (111 owns it) is unchanged.

Consistency pass over spec, plan and tasks for the touched places:

- Every requirement has at least one task; the count of requirements (10 FR, 4 SC) is unchanged.
- T034 is an operational task, not a test of a requirement, so it carries no `proves:`; the macOS
  statements it would verify come from the Constraints of the spec, which name no requirement.
- `tests/characterization/149/` appears in plan.md and tasks.md alike; no `tests/own/149/` remains.
- The warning is named once, "critic-diversity warning", in spec, tasks, quickstart and
  data-model; no "same-model warning" remains anywhere in the feature.
- The coverage table of tasks.md is unchanged and still lists CT-149-1 to CT-149-10 against their
  tasks; the ep line of F149-FR-009 is covered by CT-149-9 (T013).
- `docs/ecosystem/check-traceability.py --require-all` passes after the repairs.

## Third analyze run (2026-09-30)

Artifacts: spec.md, plan.md, tasks.md, with research.md, data-model.md, contracts/ and
quickstart.md. Constitution v3.0.1. 21 findings, none CRITICAL. The repairs are listed in the spec
section "Repairs after the analyze run of 2026-09-30". Three findings were first marked
Deferred; at the owner's instruction they are now resolved: the fix of each that lies in this
folder is applied, and what lies outside is proposed below. This feature is correct whether or
not feature 100 adopts the proposals.

| ID | Summary | Fix in this feature |
|---|---|---|
| U1 | T003 and T004 put files in `packages/contracts/data/` and `schemas/`, which the sync script of feature 100 (its T008) deletes and re-copies from `specs/100-specstride/contracts/` | T003: the bump table is the frozen constant `packages/core/src/ep18/bump-table.ts`, validated at load by the evaluator and compared with `contracts/bump-table.json`. T004: the two EP-18 values are types with guards in `packages/contracts/src/ep/ep18-values.ts`; they are never written as records, so they need no schema file and no schema id of annex B §B.20 |
| U2 | T007 writes a rule file that `check:imports` does not read | `contracts/gate-writers-rule.json` holds the rule in the form of P2; T007 copies it to `tools/import-boundary/rules/gate-writers-149.json`; T011 (CT-149-7) applies it itself until the check reads rule files |
| I9 | Row 32 of annex X §X.7 says "101 performs the comparison" | Nothing to change here: F149-FR-008 and T016 already perform it; `research.md` points at P3 |
| R1 | `research.md` did not list ruling 49, on which F149-FR-005 rests | Added |
| R2 | `research.md` still reported the bump table missing from F100-FR-204, which now names it | Marked resolved |

## Proposed upstream fixes

Each is ready to apply by the owner of feature 100. None is required for this feature to be
implemented.

### P1 — A place for the data files of other features (recommended; not needed by 149)

- **Target**: `specs/100-specstride/plan.md`, section "Project Structure", the entry of
  `packages/contracts/`; and `specs/100-specstride/tasks.md`, T008.
- **Text to add to the plan**: "`packages/contracts/data/` and `packages/contracts/schemas/`
  belong to the sync script (T008) and hold only the files of feature 100's contracts. A data file
  or a schema of another feature lives in `packages/contracts/features/<NNN>/data/` or
  `packages/contracts/features/<NNN>/schemas/`, placed by a task of that feature; the sync script
  never touches `features/`, the generator of T009 and the loader of T232 read it as well, and a
  schema there needs a row of annex B §B.20 like any other."
- **Text to add to T008**: "The script copies only into `data/` and `schemas/`; it never removes
  or writes under `packages/contracts/features/`."
- **Why**: 101 T004, 115 T004, 116 T002 and the old T003 of this feature all copy into
  `packages/contracts/data/`, which `syncDir` removes with `rmSync(dst, { recursive: true })` at
  every sync. 149 no longer depends on this; the others still do.

### P2 — A reader of import-rule files in the import-boundary check

- **Target**: `specs/100-specstride/tasks.md`, a new task after T236 in Phase 2 (next free id),
  and a line in `plan.md` under `tools/import-boundary`.
- **Task text**: "Implement the rule files of the import-boundary check: read every
  `tools/import-boundary/rules/*.json` of the form `{ rule, owner, requirement, from: [path
  globs], forbid: [path globs of modules], reason }`, refuse a file that lacks a field, and fail
  `check:imports` with the file, the import and the rule id when a source file that `from`
  matches imports a module that `forbid` matches (resolved path, relative or through a package
  export), in tools/import-boundary/src/rule-files.ts, with tests of a permitted and a forbidden
  import in tools/import-boundary/test/rule-files.test.ts."
- **Why**: `mayImport` works per package, but the writers of the phase gate and the planners of
  EP-18 are both in `@specstride/core`, so only a rule on files can keep them apart (F149-FR-007;
  Principle II). 101 T005 names the same directory. The form is that of
  `contracts/gate-writers-rule.json`.

### P3 — Row 32 of annex X §X.7

- **Target**: `specs/100-specstride/annexes/X-cross-layer.md`, §X.7 row 32, column of the owner;
  then `contracts/tools/generate.py` for `contracts/data/parity-profile.json`.
- **Change**: "116; 101 performs the comparison" → "116; 149 performs the comparison".
- **Why**: the comparison of the tree at phase entry moved to 149 in the split of 101
  (F101-FR-049 → F149-FR-008; "Ids before the split" of `spec.md`). The switch
  `integrity.phase_entry` stays with 116.
