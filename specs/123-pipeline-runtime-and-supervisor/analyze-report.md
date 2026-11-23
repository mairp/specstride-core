# Analyze report: feature 123-pipeline-runtime-and-supervisor

Run 1 of speckit-analyze (non-destructive). Date 2026-09-29. Inputs: spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/, the constitution v3.0.0.

## Findings

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | Medium | The register count in Assumptions said 94 rows; the register now has 97 (DV-001 to DV-097) | Fixed in spec.md |
| 2 | Low | Task numbering skipped T034 | Fixed: T034 added (verbs and cadence test) |
| 3 | Low | `proves:` lines of tasks named success criteria, which the coverage script reads as clusters | Fixed: success criteria moved into the task text |
| 4 | Info | Annex X §X.6 says 21 relaunch refusals; the baseline code holds 30 spellings, and table 2 adds 4 refusals and 1 approval (34 refusals in all) | Kept, reported as CQ-052 |
| 5 | Info | Terms: `gate`, `contract`, `tier` appear only in qualified form or in as-is literals (`[MOL-GATE]`, `supervise gate`, `[DRY-RUN] contract`, `contract_digest`) | None |

## Coverage

| Check | Result |
|---|---|
| Requirements: 41 (FR-001 to FR-041), 10 success criteria | Under the limit of about 45: no split proposed |
| Every kept as-is requirement (10 FR, 3 SC) in an `origin:` | Yes (check h1) |
| Every kept cluster (19; 177 kept items of 178) in an `origin:` | Yes (check h1); one item, B-2757, is `superseded-by DV-009` and listed |
| Every kept id proved by a `proves:` of a test task | Yes (check h3) |
| Every requirement with an origin has disposition and test | Yes (check h2) |
| Every requirement is covered by a task | Yes: FR-001 to FR-041 are named in T005 to T077 or T078 |
| Every user story has tests and implementation | Yes (Phases 3 to 7) |
| Constitution Check | All 20 gates answered; no violation |
| contracts/tools/generate.py --check | ok |
| `python3 docs/ecosystem/check-traceability.py` | No line starting with `[h` names this feature |

## Remaining

Nothing failed. Open readings are CQ-046 to CQ-053 in spec.md, for the orchestrator.

## After the cross-feature review

Dated 2026-09-30. Work from the section of feature 123 in `docs/ecosystem/reviews/REPAIR-WORKLIST.md` and from the orchestrator's message of the same day. Every item was checked against the file first. The items are listed in `repair-report.md`.

### What changed

| Subject | Change |
|---|---|
| Table 1, `relaunch-observe` | Signals `blocked`, `retryable`, `parityProfile`; rows O-33 and O-34 between O-24 and O-25; both inactive under the `parity` profile (register row DV-114). New requirement F123-FR-042; F123-FR-030 changed in place |
| Labels of default output | Four lines of `supervise` carry labels that start with `[SPECSTRIDE-SUPERVISE-`; `[SPECSTRIDE-DIGEST]` takes the keys of annex G §G.3. New requirement F123-FR-043 |
| Terminal tool | F123-FR-011 has a fallback to the pipe; new requirement F123-FR-044 for the doctor check; the plan names `script` as an optional platform tool |
| Events | F123-FR-018 names `pipeline.started`, `pipeline.ended`, `launch.checked` and `digest.written` |
| Other | Threat table (T-11, T-47); EP-14 `implements (an entry)`; "engine start"; the register without a count; contracts of feature 100 named in F123-FR-031 and F123-FR-034; test directories of feature 100; the 14 test names of `spec.md` that no task carried |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirements: 44 (F123-FR-001 to F123-FR-044), 10 success criteria | Under the limit of about 45: no split |
| Every new requirement has a test and a test task with `proves:` | F123-FR-042: CT-123-142, T082 and T083. F123-FR-043: CT-123-143, T085. F123-FR-044: CT-123-145, T088 |
| Every requirement changed in place has a task for the change | F123-FR-011: CT-123-144, T087, T089. F123-FR-018: T090. F123-FR-030: T022, T083. F123-FR-039: T085, T086 |
| Every `CT-123-*` and every `PT-123-*` pattern of `spec.md` is named in `tasks.md` | Yes. `PT-123-C-nnn-*` in the table of as-is ids is a pattern for the 19 clusters, not a test name |
| Task without a requirement | None among T082 to T090 |
| Tasks: 90 (T001 to T090) | No id renumbered |
| Rows of table 1 in `spec.md` and in `contracts/relaunch-observe.table.json` | 34 rows in both; order equal; the last row is O-32 and has no predicate |
| Literals of the closed set of relaunch refusals | Unchanged: table 1 now uses two members that table 2 already had. `contracts/closed-sets.json` did not change |
| Labels of default output in `spec.md` §R.8 and in `contracts/supervise-verbs.json` | Equal: 12 lines |
| The count of requirements in `plan.md`, `quickstart.md`, `checklists/requirements.md` | 44 in each |
| Test paths in `plan.md` and `tasks.md` | `tests/parity/123/`, `tests/characterization/123/`, `packages/testkit/src/conformance/EP-19/`, `packages/testkit/src/samples/EP-19/` in both |
| Exhaustive evaluation of both generated tables over the finite domains of their signals | Table 1, outside `parity`: 16,384 vectors with a blocked run, 0 relaunched. Table 2: 36,864 vectors with a blocked run, 0 relaunched. A stop with `retryable: true` and no blocked reason reaches a relaunch row in both |
| Constitution Check | Row XVI re-checked: passes after the change. Row VI re-checked: the tool is documented |
| `python3 contracts/tools/generate.py --check` | ok |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h |

### Remaining

| Point | State |
|---|---|
| Under the `parity` profile the rows O-33 and O-34 are inactive, as register row DV-114 says | Stated in F123-FR-042. No fixture of FX-35 or FX-36 ends with a blocked reason. Reported, with a recommendation |
| CQ-222, CQ-223 | Two readings without a queue number; reported |
| The summary of this report above ("41 requirements") | Left as the record of 2026-09-29 |

## Run of 2026-09-30 (evening): findings and repairs

A new run of speckit-analyze found 24 findings (0 critical). Twenty-one were repaired in `spec.md`, `plan.md` and `tasks.md`, two were accepted (G7: SC-001 is measured on engine-stub scenarios; D1: F123-FR-030 and F123-FR-042 restate each other consistently), and one, U2, needs a row of feature 100 and is proposed below. Tasks: 91 (T091 added). `contracts/tools/generate.py --check`: ok.

## Proposed upstream fixes

| # | Finding | Target file and section | Exact change | Why |
|---|---|---|---|---|
| 1 | U2: the refusal `no-live-run` of `supervise hold` and `supervise release` is in no closed set | `specs/100-specstride/annexes/X-cross-layer.md`, §X.6 "List of closed sets", after row 278 (take the next free number if 279 is taken by then) | Add the row: `\| 279 \| Hold refusals \| `no-live-run` \| 123 \| Design \| Refusal \|` | F100-FR-208 asks every closed literal to be in a listed set with an owner and a rule for an unknown value. Annex G §G.1 already has the two verbs, and §G.4 already gives them "0 written; 4 refused", but the only refusal they can print has no row. The static test of F100-FR-209 would find no branch for it |

This feature is already correct under the proposal: `spec.md` "Closed sets" lists "Hold refusals (proposed row 279)" with the member `no-live-run`; F123-FR-032 names the set and exit 4; `contracts/closed-sets.json` holds `holdRefusals` (generated by `contracts/tools/generate.py`); T006 registers the set and T024 tests the refusal. If the upstream row gets another number, only the number in `spec.md` "Closed sets" and in T006 changes.
