# Specification Analysis Report: feature 146-harness-discovery

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `data-model.md`,
`research.md`, `quickstart.md`, `contracts/`, the constitution v3.0.0. The feature is the second
part of the split of feature 124. Two passes were run; the first found F1 and F2, which were
repaired; the second found nothing new.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| F1 | Coverage | MEDIUM | plan.md Performance Goals; spec.md F146-FR-010 | The plan stated a limit of one line and 200 bytes for the message of an ignored entry; no requirement held it | Repaired: the limit is in F146-FR-010 and in task T016 |
| F2 | Inconsistency | MEDIUM | data-model.md | One row of the candidate cited a requirement of the other part for the identity of the provider | Repaired: it cites feature 100, annex X §X.9, threat T-14 |
| F3 | Underspecification | LOW | spec.md "Rows of the `parity` profile" | Three rows are requested that annex X §X.7 does not hold | Open: reported; feature 100 adds them |
| F4 | Underspecification | LOW | spec.md "Closed sets"; plan.md | Row 34 of annex X §X.6 and the package graph of feature 100 name feature 124 as owner; after the split it is 146 | Open: reported |
| F5 | Underspecification | LOW | spec.md Assumptions | Feature 100 holds the record that results from discovery (annex C §C.6) and no contract for the hand-over of the list in memory | Open: reported; both parts describe the list by the field `harnesses` |
| F6 | Underspecification | LOW | plan.md Storage; research.md D-7 | Two logical names are missing in annex B §B.5 (bundled harness descriptor, bundled catalogue snapshot), and `user:harness-verify:<id>` has no schema | Open: reported |

No CRITICAL and no HIGH finding. No conflict with the constitution.

## Coverage summary

| Requirement key | Has task? | Task IDs |
|---|---|---|
| F146-FR-001 | Yes | T010, T021 |
| F146-FR-002 | Yes | T004, T009, T010, T019 |
| F146-FR-003 | Yes | T011, T019 |
| F146-FR-004 | Yes | T005, T006, T015 |
| F146-FR-005 | Yes | T012, T019 |
| F146-FR-006 | Yes | T013, T019 |
| F146-FR-007 | Yes | T013, T019, T028 |
| F146-FR-008 | Yes | T014, T020, T027 |
| F146-FR-009 | Yes | T015, T021 |
| F146-FR-010 | Yes | T016, T019 |
| F146-FR-011 | Yes | T016, T021 |
| F146-FR-012 | Yes | T017, T021, T026 |
| F146-FR-013 | Yes | T004, T022, T023 |
| F146-FR-014 | Yes | T003, T007, T008, T029 |
| F146-FR-015 | Yes | T022, T023 |
| F146-FR-016 | Yes | T022, T023, T026 |
| F146-FR-017 | Yes | T004, T024, T025 |
| F146-FR-018 | Yes | T024, T025 |
| F146-FR-019 | Yes | T024, T025 |
| F146-SC-001 | Yes | T002, T018 |
| F146-SC-002 | Yes | T001, T014, T015 |
| F146-SC-003 | Yes | T007 |

As-is ids: none is assigned to this part, so none is carried and none is left out.

## Unmapped tasks

T030 (the run of the quickstart) serves the feature as a whole.

## Checks run

| Check | Result |
|---|---|
| Every requirement id unique; every id cited anywhere exists | Pass |
| Every functional requirement has a `test:` field | Pass |
| Every test named in `spec.md` is a task of `tasks.md` | Pass |
| Every task follows the checklist format; ids run in order | Pass |
| No requirement, test or task of the other part is cited | Pass. The ids of feature 124 appear only in the table "Ids before the split" |
| Terms marked "never bare" | Pass. What is left is the literal `adapter` of closed set 35 of feature 100 |
| No marker `NEEDS CLARIFICATION`, `CQ-pending` or `DV-new` | Pass |
| The name of the machine-specific registry entry | Absent from every file |
| Twenty gates of the Constitution Check answered | Pass: 14 pass, 6 not applicable (II, IV, XIV, XV, XVI, XX) |

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 19 |
| Success criteria | 3 |
| Tasks | 30 |
| Coverage (requirements with at least one task) | 100 per cent |
| Ambiguity count | 0 |
| Duplication count | 0 |
| Critical issues | 0 |

## Next actions

The work may proceed. Open points are for the orchestrator and are listed in the final report.

## After the cross-feature review

Date 2026-09-30. Repairs from `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section Feature 146.
Report: `specs/146-harness-discovery/repair-report.md`.

### What changed

- **W-146-01** (high): the result of `harness verify` (`specstride.harness-verify/1`) now has the
  eight field names of the owner, this feature: `schema`, `harness`, `version`, `descriptorHash`,
  `at`, `outcome`, `cases`, `budget`, with `schema` required. Changed in `spec.md` (Key Entities),
  `data-model.md` and `contracts/schemas/harness-verify-result.schema.json` (with
  `$id urn:specstride:schema:specstride.harness-verify/1`, per the rule of
  `specs/100-specstride/contracts/README.md`, item W-100-16, already repaired). The sentence
  "Feature 100 gives the logical name and no schema" is dropped. Feature 109 (the writer) took the
  same names on 2026-09-30.
- **W-X-11** (medium): rows 87, 88 and 89 of annex X §X.7 are cited by number and marked
  confirmed, in `spec.md` (F146-FR-016 parity line, the table "Rows of the `parity` profile", the
  Assumptions), `contracts/config-keys.json` and `contracts/parity-rows.json`; the labels P-1 to
  P-3 and the word "proposed" are gone. The register of row 89 in `parity-rows.json` is DV-049, as
  annex X §X.7 and the table of `spec.md` already said (DV-106 stays the divergence of
  F146-FR-016 itself). `contracts/requirements.json` follows.
- **W-X-18** (medium): the requirement F146-FR-014 gained the line
  `- ep: EP-14 specstride.doctor/1 (consumes)`, so the row EP-14 of "Extension points" has its
  requirement. Also in `contracts/requirements.json`.
- **W-X-25** (medium): the logical name `package:catalogue` (annex B §B.5) is named in F146-FR-016
  and in the step `catalogue` of the probe ladder; `plan.md` (Storage) and `research.md` (D-7)
  name `package:harness:<id>` and `package:catalogue` in place of "requested from feature 100".
- **W-X-07** (medium): the stale sentence that the package graph lacks owner 146 of
  `@specstride/harness` is removed from `plan.md`; the graph names the owners
  "109, 124, 126, 146" today.
- **W-100-13** (medium, pointer): verified, no change. Every `ep:` line of `spec.md` says
  `consumes`; no line claims a sub-point "discovery: 146" of EP-02.

### Consistency pass over the touched places

- Requirement without a task: none. F146-FR-014 keeps its test CT-146-14 and its task T007; the
  new `ep:` line adds no requirement. No requirement was added, so the count stands at 19
  functional requirements, 3 success criteria, 30 tasks.
- Task without a requirement: none. No task changed.
- Terms and values between the files: the eight field names now match between `spec.md`,
  `data-model.md` and the schema file, and match the writer's list in
  `specs/109-harness-seam/data-model.md`. The row numbers 87, 88, 89 match
  `specs/100-specstride/annexes/X-cross-layer.md:552` to `:554` and the config-keys.tsv of
  feature 110. The register of row 89 is DV-049 everywhere that states the profile row; DV-106
  stays only as the divergence of F146-FR-016.
- `python3 docs/ecosystem/check-traceability.py --require-all` passes after the repairs
  (checks a to h).

## Analyze run of 2026-09-30 (second run)

16 findings; 15 repaired or accepted inside this feature (see the run's report). One finding
needed a change outside this feature:

| ID | Severity | Summary | State |
|---|---|---|---|
| F2 | MEDIUM | `package:catalogue` and `package:harness:<id>` have physical paths under the root `package` in feature 100 (the templates stand in `plan.md` and in feature 100's `contracts/`), while `plan.md` and `tasks.md` placed the files at `packages/harness/data/catalogue.snapshot.json` and `packages/harness/data/descriptors/` with no mapping | Proposed upstream (U-1); this feature repaired to match: the workspace files are `packages/harness/data/catalogue/catalogue.snapshot.json` and `packages/harness/data/descriptors/<id>.yaml`, read only through the logical names (`plan.md` Storage and structure, `tasks.md` T003 and T023, `research.md` D-7) |

## Proposed upstream fixes

### U-1 — Workspace source of the `package` root (feature 100)

- **Target**: `specs/100-specstride/contracts/sources/physical-paths.json`, object `roots`, key
  `<package>`; and the matching sentence of annex B §B.5 (`specs/100-specstride/annexes/B-*.md`),
  where the root `package` is described.
- **Change**: replace the value `"The installed package, read only"` with
  the value that adds: the build of the published package copies each workspace package's data/
  tree into it, so that `packages/harness/data/descriptors/<id>.yaml` feeds `package:harness:<id>`
  and `packages/harness/data/catalogue/` feeds `package:catalogue`, and code reads these files only
  through their logical names (the two path templates themselves stand in `plan.md` and in feature
  100's `contracts/`, F100-FR-038),
  and add the same sentence to annex B §B.5 after the description of the root `package`.
- **Why**: the layout names the physical path in the installed package but not which workspace
  file feeds it, so feature 146 (and 109, the other reader of `package:harness:<id>`) could not
  place its shipped data without guessing. The proposal fixes the mapping in the one file that
  owns physical paths; feature 146 already follows it, and a reader that goes through the logical
  name is correct whatever the build step looks like.
