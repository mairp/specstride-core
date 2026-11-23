# Specification Analysis Report: Check integrity and unit evidence (feature 116)

Date: 2026-09-29. Artifacts: `spec.md`, `plan.md`, `tasks.md`, with `research.md`,
`data-model.md`, `quickstart.md` and `contracts/`. Constitution v3.0.0.

Runs: two. Run 1 found row A1. It was repaired. Run 2 found no finding of severity CRITICAL,
HIGH or MEDIUM. The rows C1 to C5 are reports to the orchestrator and not defects of the three
artifacts.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| A1 | Terminology | LOW | spec.md, Clarifications | "gate" used bare in one question | Repaired in run 1: "verification gate" |
| B1 | Coverage | LOW | spec.md user stories | 2 requirements (F116-FR-001, F116-FR-011) are cited by no acceptance scenario or edge case; each has a test and a task | Accepted |
| C1 | Report | — | spec.md "Closed sets", "Extension points" | Feature 100 names feature 115 as content owner of EP-16, of the fact block and of closed set rows 27, 65 and 66, and as owner of row 32 of the profile. After the split the owner is this feature | For the orchestrator |
| C2 | Report | — | spec.md F116-FR-004 | Register row DV-052 and the layer allowlist of feature 141 name two files; the record of the protected set is a third | CQ-084 |
| C3 | Report | — | spec.md F116-FR-013 | Annex C §C.14 says a profile names no command; rule IR-36 reads the effective configuration | CQ-085 |
| C4 | Report | — | plan.md "Structure Decision" | The package graph of feature 100 has no package of this feature | `@specstride/integrity` proposed |
| C5 | Report | — | spec.md "Closed sets" row 66 | Annex D §D.7 names four further facts; this feature lists a fifth, `task-list-changed` (rule IR-56) | For the orchestrator |

## Coverage Summary

| Requirement key | Has task? | Test tasks | Implementation tasks |
|---|---|---|---|
| F116-FR-001 to F116-FR-008 | Yes, all 8 | CT-116-1 to CT-116-8; CT-116-111, 116, 131, 135, 138, 140 | Phase 3 |
| F116-FR-009 to F116-FR-012 | Yes, all 4 | CT-116-9 to CT-116-12; CT-116-112, 133, 136, 137, 139, 141 | Phase 3 |
| F116-FR-013 to F116-FR-015 | Yes, all 3 | CT-116-13 to CT-116-15 | Phase 5 |
| F116-FR-016 to F116-FR-021 | Yes, all 6 | CT-116-16 to CT-116-21; CT-116-117, 118, 142, 143, 144, 146 | Phase 4 |
| F116-SC-001 | Yes | The tamper test and the inertness test of phase 6 | The tamper fixtures of phase 2 |
| F116-SC-002 | Yes | The test of identical blocks of phase 6; CT-116-20 | — |
| F116-SC-003 | Yes | The build check of phase 6 | — |

**Constitution Alignment Issues**: none. All twenty gates of `plan.md` are answered; seventeen
pass and three are not applicable (XV, XVI, XX).

**Unmapped Tasks**: none. Every task carries `covers:` or `proves:`.

**Citations of the sibling feature**: none. Ids of feature 115 appear only in the table
`## Ids before the split`, as the split rule asks.

## Metrics

| Measure | Value |
|---|---|
| Functional requirements | 21 |
| Success criteria | 3 |
| Tasks | 70 (US1 35, US2 17, US3 7; setup, foundational and polish: 11) |
| Test tasks of requirements and integrity rules | 39 (21 of requirements, 18 of integrity rules) |
| Tasks that can run in parallel | 56 |
| Coverage (requirements with one task or more) | 100 per cent |
| Ambiguity count | 0 |
| Duplication count | 0 |
| Critical issues | 0 |
| Requirements with `origin:` | 0 |
| Requirements that cite a register row or a question still to be written | 0 |

## Next Actions

| Action | Who |
|---|---|
| Change the content owner in feature 100 (row C1) and add the package (row C4) | The orchestrator |
| Answer CQ-084 and CQ-085 | The owner, through the clarify queue |
| Implementation can start with phases 1 to 3 once the check runner and the check manifest exist | — |

No remediation is open for the three artifacts.

## After the cross-feature review

Date: 2026-09-30. Source: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section of feature 116,
and `specs/100-specstride/repair-report.md`, table "What the other features must follow". The
rows above are the state of 2026-09-29 and are kept as they were; rows C1, C4 and C5 are settled
by feature 100, and the "Next Actions" on them are done.

### What changed

| Item | Change | Files |
|---|---|---|
| W-116-01 | F116-FR-003 says where content is hashed and where the listing holds; the listing holds the time of the last change of status; the residual risk is stated in the threat table (T-19); row III of the Constitution Check is a stated deviation with a row in Complexity Tracking; `assumption: CQ-197` | `spec.md`, `plan.md`, `research.md` (D-6), `data-model.md`, `contracts/schemas/protected-set.schema.json`, `tasks.md` (T071, T074, T077), `quickstart.md` |
| W-100-02, W-100-10 | Sentences that feature 100 still names 115, or that a package or a schema id is "proposed" or "reported", are replaced by the citation of feature 100 | `spec.md`, `plan.md`, `research.md`, `tasks.md`, `contracts/README.md` |
| W-148-01 | The fields of the two records of annex B §B.20 are in the specification; new F116-FR-023 | `spec.md`, `data-model.md`, `contracts/schemas/`, `tasks.md` (T073, T076) |
| W-X-24 | New F116-FR-022 names `integrity.noted` | `spec.md`, `plan.md` (row XI), `tasks.md` (T072, T075) |
| W-110-09 | The key `toolchains.<id>` | `spec.md` (F116-FR-014), `plan.md`, `research.md` (D-7), `data-model.md`, `tasks.md` (T060, T062), `quickstart.md` |
| W-X-18 | `ep:` line of EP-03 in F116-FR-010 and F116-FR-018 | `spec.md` |
| W-X-12 | Rows 142 and 143 | `spec.md`, `contracts/closed-sets.json`, `contracts/README.md` |
| W-X-14 | Row X is N/A; the sentence on the brief | `plan.md` |
| W-X-02 | Places of the conformance cases and of the sample | `plan.md`, `tasks.md` (T065), `quickstart.md` |
| W-100-16 | `$id` of the three schema files | `contracts/schemas/*.schema.json`, `contracts/README.md` |
| Found while repairing | Reasons `protected-set-changed` and `pin-mismatch` (closed set row 53); owner 148 of the check runner | `spec.md`, `plan.md`, `data-model.md` |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. F116-FR-022: T072 (test), T075. F116-FR-023: T073 (test), T076. F116-FR-003 as changed: T009, T024, T071 (tests), T031, T032, T074, T077 |
| Task without a requirement | None. T071 to T077 each carry `proves:` or `covers:` |
| New requirement without a test | None. CT-116-22 and CT-116-23; the rule that `CT-116-<n>` below 100 is the test of requirement n holds |
| Counts | `spec.md` has 23 functional requirements and 3 success criteria; `plan.md` "Scale/Scope" says 23; `tasks.md` has 77 tasks. 18 integrity rules, 5 closed sets, 7 seeded tamperings and 1 profile row are unchanged |
| Field names of the check result | `id`, `exit`, `conditions`, `observed`, `durationMs`, `outputRef` in `spec.md`, `data-model.md` and `contracts/schemas/check-result.schema.json`: equal |
| Field names of the protected set | `schema`, `phase`, `profiles`, `basic`, `classA`, `classB`, `authorised`, `atLaunch`, `atPhaseEntry`, `exclusions`, `effectiveConfig` in the three places: equal. `basic` is a field of its own; the earlier text "`basic` when none" of `profiles` is replaced |
| Key | `toolchains.<id>` in `spec.md`, `plan.md`, `research.md`, `data-model.md`, `tasks.md`, `quickstart.md`: one spelling |
| Reasons of `tainted` | `changed-during-check`, `protected-set-changed`, `pin-mismatch` in F116-FR-005, F116-FR-006, F116-FR-009, in "Closed sets" and in `data-model.md`: equal to closed set row 53 of feature 100 |
| Constitution Check | 20 rows: 15 pass, 4 N/A (X, XV, XVI, XX), 1 stated deviation (III, in one point) with its row in Complexity Tracking. The sentence of 2026-09-29 above, "seventeen pass and three are not applicable", is replaced by this row |
| Placeholders | None. The one new question of the repair, reported in `repair-report.md` as N-1, is CQ-197 of the queue since 2026-09-30; CQ-084 and CQ-085 are real numbers of the queue |

### What remains

| Point | State |
|---|---|
| `contracts/tamperings.json` has no tampering inside an ignored path | Not added, so that the count of seven seeded tamperings of experiment X12, which feature 115 runs, stays. The case is tested by T071 |
| The doctor check of F116-FR-015 is planned in `packages/doctor/src/checks/toolchains.ts` (T064), a package of feature 112 | Not changed; no review item names it. Reported in `repair-report.md` |
| Row 32 of annex X §X.7 says "116; 101 performs the comparison" | F116-FR-012 specifies the comparison and its event; which package performs it is for the two plans. Reported |

## Third analyze run (2026-09-30)

Findings, with their state after the owner's follow-up ("resolve every issue with the best
suggestion"). Edits in `spec.md`, `plan.md`, `tasks.md`, `contracts/deliver.json` (new) and
`contracts/README.md`.

| ID | Severity | Summary | State |
|---|---|---|---|
| C1 | CRITICAL | Row III of the plan is a stated deviation from Principle III, which Governance says cannot be justified away | Accepted: the owner ruled it (CQ-197, 2026-09-30); row III and Complexity Tracking cite the ruling. Constitution text: proposal P-2 below |
| I1 | HIGH | Doctor check of toolchains planned in the package of feature 112 | Repaired: `packages/integrity/src/toolchain/doctor-check.ts`, registered through the kernel (F112-FR-033, F100-FR-234) |
| I2 | HIGH | T002 copied files under bare names that collide with files of 100 and 115 | Repaired: suffix `-116`; schemas into `schemas/` |
| I3 | MEDIUM | The sync script of feature 100 clean-copies `packages/contracts/data/` and `schemas/`, removing this feature's files | Proposed upstream: P-1 below; T002 to T004 deliver through `contracts/deliver.json` |
| U1 | MEDIUM | Tests under `tests/integrity/116/` reached by no script | Repaired in T001 |
| G1 | MEDIUM | No task for the doctor warning of F116-FR-014 | Repaired in T064 |
| D1 | MEDIUM | CQ-084, CQ-085, CQ-197 written as open | Repaired: marked closed |
| D2 | LOW | Principle IX row not re-read against v3.0.1 | Repaired: re-read, unchanged |
| A1 | LOW | "No X MUST be" phrasing in F116-FR-011, 016, 018, 022 | Repaired: "MUST NOT" |
| A2 | LOW | Edge case of an unknown integrity kind cited no requirement | Repaired |
| T1 | LOW | "class a" in T027, T030 | Repaired |
| B1 | LOW | F116-FR-001, F116-FR-011 in no acceptance scenario | Accepted: each has tests and tasks |
| O1 | LOW | Row 32 of annex X §X.7 says "101 performs the comparison" | Accepted: 101 does not claim it; no conflict in behaviour |

## Proposed upstream fixes

Ready to apply by the owner of each file. This feature is written to be correct once they are
applied, and nothing in it contradicts the files as they stand today.

### P-1 Delivery of other features' data and schema files into the `contracts` package (for I3)

**Target 1**: `specs/100-specstride/tasks.md`, task T008. Append to its description:

> , and after the two clean copies delivers the files that every other feature lists in
> `specs/<feature>/contracts/deliver.json` (keys `data` and `schemas`, each a map from the target
> name in the package to a path relative to that feature's `contracts/`), failing when a target
> name already exists or two features name the same target, and verifying each delivered file
> byte for byte

**Target 2**: `packages/contracts/scripts/sync.mjs` (code of feature 100, done under its T008).
In `main()`, after `syncDir(...)` for `data`, add one step `deliverFeatureFiles()` that reads
`specs/*/contracts/deliver.json` (sorted by directory name, `specs/100-specstride` skipped),
copies each entry to `packages/contracts/<data|schemas>/<target>`, fails with exit 1 when the
target exists or a source is missing, and counts the delivered files in the final line.

**Target 3**: `specs/100-specstride/tasks.md`, section "Path Conventions", after the sentence
on T008 add:

> A file that another feature delivers through its `contracts/deliver.json` is a data file of the
> package too; its target name carries the number of that feature (`closed-sets-116.json`).

**Why**: F100-FR-227 and annex C §C.14 ask owners to deliver schema files to the `contracts`
package, and the sync (T008) deletes both directories on every run, so a hand copy cannot
survive. A manifest per feature keeps the generator check of feature 100 intact (the annex
files stay generated), keeps one writer of the package directories (the sync), and turns a
name collision, the risk of finding I2, into a failure of the build. Features 115 and 149
report the same gap and can use the same manifest.

**This feature under P-1**: `contracts/deliver.json` lists four data files and three schema
files with their target names; T002 to T004 deliver through it; phase 2 depends on P-1.

### P-2 Principle III names the Wave 1 limit that the owner ruled (for C1)

**Target**: `.specify/memory/constitution.md`, Principle III, second bullet, after "…recorded as
tainted and never as passed. (**DP-040**)" add:

> Inside an ignored path from which a check executes, a listing of name, kind, size, mode,
> modification time and time of the last change of status is the detection for files that are
> neither pinned executables nor matched by a class A pattern of a toolchain profile; this holds
> for Wave 1 and is recorded as a residual risk. (Owner, CQ-197, 2026-09-30; feature 116.)

With it a version bump 3.0.1 → 3.0.2 (PATCH, as CQ-182 was for IX) and a line in the Sync Impact
Report.

**Why**: the owner ruled the limit on 2026-09-30, and Governance says Principle III cannot be
justified away in a plan, so the ruling belongs in the principle itself, as CQ-182 was written
into Principle IX. After it, row III of this plan becomes ✅ with the citation and the Complexity
Tracking row can be removed. Until then the plan keeps the stated deviation, which is correct
under the owner's ruling.
