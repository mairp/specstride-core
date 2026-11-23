# Specification Analysis Report: Micro-loop layer (feature 115)

Date: 2026-09-29, after the split. Artifacts: `spec.md`, `plan.md`, `tasks.md`, with
`research.md`, `data-model.md`, `quickstart.md` and `contracts/`. Constitution v3.0.0.

This report replaces the report written before the split. Requirement group G-B (21
requirements, 2 success criteria, 39 tests) is now feature
`116-check-integrity-and-unit-evidence`; `spec.md` lists the ids under "Requirements moved to
116-check-integrity-and-unit-evidence".

Runs after the split: one. It found no finding of severity CRITICAL, HIGH or MEDIUM. The rows
A1 to A6 of the report before the split were repaired then and stay repaired.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| B1 | Underspecification | LOW | spec.md F115-FR-010 | The size limits of a checkpoint have no source | Kept as starting values; CQ-086 |
| B2 | Coverage | LOW | spec.md user stories | 13 requirements are cited by no acceptance scenario or edge case; each has a test and a task | Accepted |
| B3 | Inconsistency | LOW | spec.md, sequence of ids | F115-FR-043 to F115-FR-063, F115-SC-004 and F115-SC-008 are missing from the sequence | Intended: the ids moved and are not reused |
| C1 | Report | — | spec.md F115-FR-005 | Closed set row 59 of feature 100 has no member for the fallback while the tripwire record exists | CQ-080 |
| C2 | Report | — | spec.md F115-FR-041 | Annex B §B.18 draws the `kind` of the tripwire record from the integrity kinds; a breach is not an integrity event | CQ-083 |
| C3 | Report | — | spec.md F115-FR-012 | Register row DV-052 and the layer allowlist of feature 141 do not name the task list as read at launch | CQ-084 |
| C4 | Report | — | spec.md F115-FR-012 | Annex B §B.5 holds no logical name for the task list as read at launch | CQ-181 |
| C5 | Report | — | spec.md F115-FR-038 | Annex G §G.3 has no key of the `[LOOP]` line for the basic protection | CQ-082 |
| C6 | Report | — | spec.md F115-FR-002 | Annex D §D.1 lists the inputs of a layer and "the services the layer declared and the engine offers", and names no service. The layer declares fingerprints and the builder of the fact block | For the orchestrator: a list of services in annex D §D.1 |
| C7 | Report | — | plan.md "Structure Decision" | The package graph of feature 100 has no edge package of feature 115 | `@specstride/layer-micro-io` proposed |
| C8 | Report | — | spec.md F115-FR-037 | The event names of the layer are not in any contract; the register names two | Asked of feature 111 |
| C9 | Report | — | spec.md "Rows of the `parity` profile" | 11 rows are needed that annex X §X.7 does not hold | Proposed |

## Coverage Summary

| Requirement key | Has task? | Test tasks | Implementation tasks |
|---|---|---|---|
| F115-FR-001 to F115-FR-008 | Yes, all 8 | CT-115-1 to CT-115-8; CT-115-101, 127, 134, 152, 158 | Phases 3 and 5 |
| F115-FR-009 to F115-FR-012 | Yes, all 4 | CT-115-9 to CT-115-12; CT-115-109, 155, 156 | Phase 3 |
| F115-FR-013 to F115-FR-021 | Yes, all 9 | CT-115-13 to CT-115-21; CT-115-108, 110, 113, 114, 115, 120, 132, 153, 160 | Phases 3 and 4 |
| F115-FR-022 to F115-FR-027 | Yes, all 6 | CT-115-22 to CT-115-27; CT-115-106, 107, 123, 148, 150 | Phases 3 and 4 |
| F115-FR-028, F115-FR-029 | Yes | CT-115-28, 29; CT-115-105, 149 | Phase 4 |
| F115-FR-030 to F115-FR-032 | Yes, all 3 | CT-115-30 to CT-115-32; CT-115-125, 126 | Phase 6 |
| F115-FR-033 to F115-FR-036 | Yes, all 4 | CT-115-33 to CT-115-36; CT-115-147 | Phase 4 |
| F115-FR-037 to F115-FR-041 | Yes, all 5 | CT-115-37 to CT-115-41; CT-115-128 | Phase 7 |
| F115-FR-042 | Yes | CT-115-42 | Phase 9 |
| F115-FR-064 to F115-FR-066 | Yes, all 3 | CT-115-64 to CT-115-66 | Phase 8; T001 |
| F115-SC-001, F115-SC-002 | Yes | — | The PAID tasks of phase 8 (X5, X6) |
| F115-SC-003 | Yes | The test of phase 9 that asserts the invariant | — |
| F115-SC-005 to F115-SC-007 | Yes | The three tests of phase 9 | — |
| F115-SC-009, F115-SC-010 | Yes | CT-115-31; every test task | — |

**Constitution Alignment Issues**: none. All twenty gates of `plan.md` are answered; eighteen
pass and two are not applicable (XV, XX).

**Unmapped Tasks**: none. Every task carries `covers:` or `proves:`.

**Citations of the sibling feature**: none. Ids of feature 116 appear only in the table
"Requirements moved to 116-check-integrity-and-unit-evidence". Where a requirement named a
requirement that moved, it now names the contract of feature 100:

| Requirement | Named before | Names now |
|---|---|---|
| F115-FR-039 | The requirement that is now F116-FR-019 (fields the fact block never holds; old id F115-FR-061) | Annex D §D.7, "Never in the block" |
| F115-FR-038 | The closed set `protection` of the requirement that is now F116-FR-007 (old id F115-FR-049) | Annex E §E.2 (run record, field `containment`); annex C §C.14 |
| F115-FR-016 | Equal fingerprints (the requirement that is now F116-FR-005; old id F115-FR-047) | Annex C §C.8, the conditions of a result |
| F115-FR-014, F115-FR-032 | The integrity kinds of this specification | Annex X §X.6, row 65 |
| F115-FR-012, F115-FR-029 | The further facts of this specification | Annex D §D.7 |
| F115-FR-002 | — (new text) | Annex D §D.1 and §D.7: the layer returns the rows of the fact block |

## Metrics

| Measure | Value |
|---|---|
| Functional requirements | 45 |
| Success criteria | 8 |
| Tasks | 138 (US1 39, US2 33, US3 13, US4 8, US5 13, US6 13; setup, foundational and phase 9: 19) |
| Test tasks of requirements and integrity rules | 73 (45 of requirements, 28 of integrity rules) |
| Tasks that can run in parallel | 91 |
| PAID tasks | 5 |
| Coverage (requirements with one task or more) | 100 per cent |
| Ambiguity count | 0 |
| Duplication count | 0 |
| Critical issues | 0 |
| Lines of `check-traceability.py` that start with `[h` and name feature 115 or 116 | 0 |
| Requirements with `origin:` | 0 (no as-is row is assigned to this feature) |
| Requirements that cite a register row to be written | 0 |
| Questions still to be numbered | 1 (CQ-181) |

## Next Actions

| Action | Who |
|---|---|
| Answer CQ-080 to CQ-084, CQ-086 and CQ-181 | The owner, through the clarify queue |
| Add the rows, names, services and the package that rows C1 to C9 report | The orchestrator, in feature 100 and the register |
| Implementation can start with phases 1 to 3 once the call points, the check runner and the fingerprints exist | — |

No remediation is open for the three artifacts.

## After the cross-feature review

Date: 2026-09-30. The sections above are the record of 2026-09-29 and were changed in one place
only: the three rows of the table "Citations of the sibling feature" now give the new ids
(item W-115-03). Rows C4, C7, C8 and C9 of the findings are settled: the logical name is
`run:<runId>:task-list`; the package `@specstride/layer-micro-io` is withdrawn; the event types
are in the catalogue of feature 111; rows 64 and 65 of annex X §X.7 exist. The items and their
states are in `repair-report.md`.

### What changed

| Subject | Change | Files |
|---|---|---|
| Task list as read at launch | The layer reads `run:<runId>:task-list` of annex B §B.5 and stores nothing under a name of its own (W-115-01; CQ-181 applied) | `spec.md` F115-FR-012; `plan.md`; `data-model.md`; `tasks.md` T017, T043, T095, T140 |
| Escalation | `targetIsCriticModel` is true only for equal model and equal effort; a rung that shares the model alone is used with the critic-diversity warning; signal `targetSharesCriticModel` (W-115-02; CQ-191) | `spec.md` F115-FR-034, router table, IR-47; `contracts/router-table.json`; `contracts/integrity-rules.json`; `research.md` D-11; `tasks.md` T060, T067, T080, T139 |
| Owner after the split | EP-16, the fact block, the protected set, the check result, closed set rows 142 and 143 and the package `@specstride/integrity` are of feature 116; nothing here claims them | `spec.md`; `plan.md`; `data-model.md`; `contracts/README.md` |
| Packages | No package `@specstride/layer-micro-io`; two directories of `@specstride/integrity` behind ports; the core package does not import `node:fs` (W-X-01; CQ-185) | `plan.md`; `research.md` D-1, D-9; `tasks.md` T002, T003, T015, T036, T041, T043, T108, T114, T132 |
| Conformance suite | `packages/testkit/src/conformance/EP-06/`, sample in `packages/testkit/src/samples/EP-06/` (W-X-02) | `plan.md`; `tasks.md` T081 |
| Keys | lowerCamelCase in `contracts/`; `proposalMin`, `unitMin`, `checkMin` (W-X-04; W-110-11, CQ-160) | `spec.md`; `contracts/parity-rows.json`; `research.md` D-7 |
| Rows | Profile rows 64 and 65 and closed set rows 136 to 141 are cited by number (W-X-11; W-X-12) | `spec.md`; `contracts/parity-rows.json`; `contracts/closed-sets.json` |
| Events | Every event of the layer is named by its catalogue type (W-111-02; W-X-24) | `spec.md` F115-FR-010, F115-FR-011, F115-FR-014, F115-FR-023, F115-FR-032, F115-FR-033, F115-FR-034, F115-FR-037, F115-FR-041 and the table "Events of the layer" |
| Terms | "Pass limit", "pass count", "is given back"; "engine start"; "model-tier bump" | `spec.md`; `tasks.md`; `quickstart.md`; `contracts/` |
| Constitution Check | Row X is N/A with a reason that bears on the principle; row XVIII points to the `divergence:` fields; rows VI, IX and XI follow the repairs (W-X-14; W-X-08) | `plan.md` |
| `ep:` lines | EP-14 (consumes) on F115-FR-039 and F115-FR-041 (W-X-18) | `spec.md` |
| `$id` | `urn:specstride:schema:specstride.checkpoint/1` (W-100-16) | `contracts/schemas/checkpoint.schema.json` |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. The 45 requirements keep their tasks. The two changed rules have a new test task each: F115-FR-034 has T139 (CT-115-161), F115-FR-012 has T140 (CT-115-162) |
| Task without a requirement | None. T139 and T140 carry `proves:`, T141 carries `covers:` |
| New test names in `spec.md` and `tasks.md` | CT-115-161 and CT-115-162 stand in the `test:` lines of F115-FR-034 and F115-FR-012 and in T139 and T140 |
| `targetIsCriticModel` | One meaning in `spec.md` (F115-FR-034, signal table, row `esc.critic-collision`, IR-47), `contracts/router-table.json`, `contracts/integrity-rules.json`, `research.md` D-11, `plan.md` row IX, `tasks.md` T060, T067, T080, T139, `quickstart.md` scenario 17. It equals F100-FR-130 and the row `escalation` of annex D §D.4 |
| Logical name of the task list | `run:<runId>:task-list` in `spec.md`, `plan.md`, `data-model.md`, `tasks.md`, `quickstart.md`. `phase:<N>:tasks-at-launch` stands only where its withdrawal is recorded |
| Key names | `grep -rn '_minutes\|Minutes\|escalations_per\|cycles_\|unresolved_units\|check_share'` over the feature finds nothing. The keys of `spec.md` and `contracts/parity-rows.json` equal row 65 of annex X §X.7 |
| Package names | `@specstride/layer-micro-io` stands only where its withdrawal is recorded (`plan.md`, `research.md` D-9, this report). Every task path is under a package of the package graph of feature 100 |
| "Iteration" | Only in the literals `giveIterationBack` and `MAX_ITER`, in the as-is name in the table of exempted mechanisms, in sentences that record the change, and in "Validation iteration 1" of the checklist, which is no counted unit of the pass loop |
| Bare "tier bump" | None |
| Number of gates of the Constitution Check | 20: 17 pass, 3 not applicable (X, XV, XX). The report of 2026-09-29 counted 18 and 2; row X changed |
| Counts | 45 functional requirements, 8 success criteria, 141 tasks (138 and T139 to T141), 75 test tasks of requirements and integrity rules, 5 PAID tasks; no PAID task is a precondition of an unpaid test |

### What stays open

| Point | Where |
|---|---|
| The owner field of `@specstride/integrity` in the package graph names 116 only; this feature owns two directories of it | `repair-report.md`, "What another feature or the orchestrator must do" |
| Feature 110 still spells the three keys `proposalMinutes`, `unitMinutes`, `checkMinutes` in `config-keys.tsv`; feature 100 and this feature write `Min` | the same |
| The divergence register holds 117 rows; `spec.md` says 113, as feature 100 does | the same |
| CQ-080 to CQ-084, CQ-086, CQ-160, CQ-185 and CQ-191 are open in the queue; the specification proceeds on the recommended answers | `spec.md`, "Assumptions" |

## Re-run after the cross-feature review (2026-09-30, later the same day)

Artifacts as of this run: `spec.md`, `plan.md`, `tasks.md` at 13:22, with `research.md`,
`data-model.md`, `quickstart.md` and `contracts/`. Constitution v3.0.1. No finding of severity
CRITICAL or HIGH. Four findings; three were repaired in place at the user's direction, one needs
no change.

| ID | Category | Severity | Location(s) | Summary | Resolution |
|----|----------|----------|-------------|---------|------------|
| D1 | Constitution | MEDIUM | plan.md, Constitution Check | The check was answered against v3.0.0 and the re-read of Principle IX against the sentence of v3.0.1 (the weaker proof, CQ-182) was deferred to this run | Re-read done: the sentence binds a tested harness adapter that starts a critic-class call (features 100, 109, 130, 134); this feature builds no adapter and starts no critic-class call; row IX stands. The preamble of the Constitution Check now names v3.0.1 and records the re-read |
| D2 | Coverage | MEDIUM | tasks.md, SC-010 | The 28 owned integrity rules each have a test task, but no task proves the completeness claim itself ("28 of 28") mechanically | New task T142: a static test that `integrity-rules.json` marks 28 rules as owned here, each naming its `CT-115-<n>` test, each test named by a task of this file |
| D3 | Coverage | LOW | tasks.md, T096, T097, T125 | F115-SC-001, SC-002 and SC-009 had no explicit trace in `tasks.md`, unlike SC-003, SC-005 to SC-007 | Traces added: T096 and T097 carry SC-009 (the 11 record kinds, the 5 resume states); T125 names the reports of SC-001 (X5) and SC-002 (X6) |
| D4 | Inconsistency | LOW | tasks.md, T139, T140 | The two tests sit in Phase 9 but must be written before T080 (Phase 4) and T043 (Phase 3) | No change: the head note and the dependency table state the order; the ids stay as added |

Verified in this run, unchanged: 45 of 45 requirements have a task (100 per cent); every test id
`CT-115-1` to `CT-115-42`, `CT-115-64` to `CT-115-66`, `CT-115-101` to `CT-115-160` (28 owned
rules), `CT-115-161` and `CT-115-162` has a task; 142 tasks in all; all 15 event types of the
table "Events of the layer" are in the catalogue of feature 111; the router table holds 20 rows
(4 + 6 + 10); 10 closed sets; 5 rows of the `parity` profile with the 10 keys of row 65; 11
record kinds and 5 resume states in `ledger-micro.json`; 14 experiments in `experiments.json`
(X0 to X12 and the arm for the model-tier bump); no placeholder; no stray "iteration"; every task
path is a path of `plan.md`. The four open points above stand as they were.

## Analyze run of 2026-09-30, evening

Artifacts: `spec.md`, `plan.md`, `tasks.md`, with `research.md`, `data-model.md`, `quickstart.md`
and `contracts/`. Constitution v3.0.1. No finding of severity CRITICAL. Nine findings: eight
repaired in this feature, one accepted; F2 is repaired in this feature under proposal U1 below.

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| F1 | Inconsistency | HIGH | tasks.md T004 | T004 copied every file of `contracts/` into `packages/contracts/data/`, `closed-sets.json` over the file of feature 100 of that name, and did again what T006, T007 and T078 do | Repaired: T004 copies only `ledger-micro`, `integrity-rules` and the checkpoint schema |
| F2 | Inconsistency | MEDIUM | tasks.md T004, T006, T007, T078, T142; plan.md | `packages/contracts/scripts/sync.mjs` removes `data/` and `schemas/` and copies them again from `specs/100-specstride/contracts/`, so every file of this feature there is lost at the next sync | Repaired here under proposal U1: every file of this feature in the package ends in `-115` (tasks.md head note, T004, T078, T142; plan.md; `contracts/README.md`) |
| C1 | Underspecification | MEDIUM | spec.md F115-FR-005 | The fallback reasons `config` and `harness` had no condition | Repaired from R25 RT-C (`loop.off`, `loop.harness`) and F115-FR-003 |
| C2 | Coverage | LOW | tasks.md T133, T129 | The release block of a breach, the default `classic` after it, and X12 (i), (ii) as release blockers had no task trace | Repaired: T133 proves F115-FR-041; T129 records breach, X12 and the default |
| I1 | Inconsistency | LOW | spec.md "Events of the layer", clarifications; plan.md | "Seven" types added by feature 111; the table and F111-FR-050 give eight | Repaired |
| I2 | Inconsistency | LOW | spec.md Assumptions | Register of 113 rows; `consolidation.md` holds 119 | Repaired in the assumption; the clarification of 2026-09-29 stays as a record |
| I3 | Inconsistency | LOW | spec.md Assumptions | Queue read "to CQ-175" while CQ-181 and CQ-191 are cited | Repaired |
| I4 | Inconsistency | LOW | plan.md Constitution Check | A note split the preamble sentence | Repaired |
| A1 | Coverage | LOW | spec.md F115-FR-038 | No task prints `strategy` in the status line | Accepted: the status line belongs to the read model; the strategy is in the run record (T092) |

Coverage: 45 of 45 requirements, 8 of 8 success criteria, 142 tasks, no unmapped task.

## Proposed upstream fixes

### U1 (for F2): the sync of `@specstride/contracts` keeps the files of other features

- **Target**: feature 100. `packages/contracts/scripts/sync.mjs` (task T008 of feature 100),
  function `syncDir`; and `specs/100-specstride/contracts/README.md`, section "How the files are
  made".
- **Change in `sync.mjs`**: before `rmSync(dst, …)`, keep aside every file of `dst` whose name
  matches `/-(\d{3})(\.schema)?\.json$/` with a number other than `100`; after `cpSync`, put
  them back; in the check of the file set, compare the source with the files of `dst` less the
  kept ones, and fail when a kept file has the name of a file of the source. Suggested text:

  ```js
  const FEATURE_FILE = /-(\d{3})(\.schema)?\.json$/;
  const kept = existsSync(dst)
    ? listFiles(dst).filter((f) => { const m = FEATURE_FILE.exec(f); return m && m[1] !== "100"; })
        .map((f) => [f, readFileSync(join(dst, f))])
    : [];
  // … rmSync + cpSync as today …
  for (const [f, bytes] of kept) {
    if (existsSync(join(dst, f))) fail(`${f} of another feature has the name of a generated file`);
    writeFileSync(join(dst, f), bytes);
  }
  const own = listFiles(dst).filter((f) => !kept.some(([k]) => k === f));
  if (own.join("\n") !== files.join("\n")) fail(`the copy of ${relative(ROOT, dst)} holds a different file set`);
  ```

  The import line gains `writeFileSync` from `node:fs`.
- **Row to add to `contracts/README.md` of feature 100**, "How the files are made": "A feature
  other than 100 places its files in `packages/contracts/data/` and
  `packages/contracts/schemas/` under names that end in `-<NNN>` (its number); the sync keeps
  them and never writes such a name. A file of feature 100 never ends in `-<NNN>`."
- **Why**: feature 116 already names `closed-sets-116.json` and `parity-rows-116.json`, and this
  feature `closed-sets-115.json` and `parity-rows-115.json`. The suffix turns that practice into
  the rule, keeps the clean copy and its check for the files of feature 100, and needs no list of
  features in the script. The other ways were worse: feeding every feature's `contracts/`
  through `generate.py` couples feature 100's generator to every feature, and a second directory
  per feature changes the `files` list of the package and the paths of 116.
- **This feature under U1**: every file it places in the package ends in `-115`
  (`router-table-115.json`, `closed-sets-115.json`, `parity-rows-115.json`,
  `ledger-micro-115.json`, `integrity-rules-115.json`, `checkpoint-115.schema.json`). The file
  names inside `specs/115-micro-loop-layer/contracts/` do not change.
- **Until U1 is applied**: do not run `npm run sync` in `packages/contracts` after T004, T006,
  T007 or T078 without restoring the `-115` files. Do not edit `packages/` while the unit
  `mol-100-specstride` is active.

## Report to feature 141 (layer allowlist)

**Reported by feature 115, phase 5 (T095), for F115-FR-012 and F115-FR-006:**
the logical name that the layer allowlist of the second suite of feature 141
needs for the task list as read at launch is

    run:<runId>:task-list

It is the record of feature 100, annex B §B.5, which the engine writes at
launch from the canonical spec model (CQ-181). The layer of this feature
reads that record and writes nothing under a name of its own
(F115-FR-012), so no other logical name of this feature can appear as a
difference in the oracle's suite 2: outside the layer allowlist
(`run:<runId>:task-list`, the checkpoint logical name, and the records of
the ledger namespace `micro`) and with equal counters, a run with the layer
and a run without it are the same (F115-FR-006; the second suite of feature
141, F141-FR-039 to F141-FR-042). Feature 141 should treat
`run:<runId>:task-list` as a read-only field of the layer in its allowlist.
