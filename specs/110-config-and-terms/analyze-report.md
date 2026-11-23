# Specification Analysis Report: feature 110-config-and-terms

Date: 2026-09-29, after the split of group G4 into feature 147-terms-gate and after the spelling of the keys of all features was settled. Artifacts read: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `tasks.md`, the constitution v3.0.0. Checks by script: id uniqueness, a `proves:` and a `covers:` line for every requirement, and `docs/ecosystem/check-traceability.py`.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| C1 | Coverage | HIGH | `tasks.md` | Seven requirements had no implementation task with `covers:` | **Repaired** (first run) |
| G1 | Terminology | LOW | `spec.md` | Bare "adapter", "gate", "tier" | **Repaired** |
| U1 | Underspecification | MEDIUM | F110-FR-007, 013, 015, 033 | Four readings that no source settles (CQ-156 to CQ-159) | **Open by design** |
| U2 | Underspecification | MEDIUM | `contracts/alias-table.tsv` | Only first rows; the rest needs the 226 inventory items | **Open**: T005 |
| V1 | Ambiguity | LOW | F110-FR-003, 031 | Facts not yet run (macOS path, keychain query) | **Open by design**: T001 |
| F1 | Inconsistency | MEDIUM | Annex X §X.2 and the baseline | Where the declared per-phase value stands | **Open; reported** |
| F2 | Coverage | MEDIUM | Annex X §X.7, §X.6, §X.8 | Rows for keys other features proposed; alias rows; a closed-set row | **Open; reported** |
| F3 | Inconsistency | LOW | `contracts/config-keys.tsv`, specs of 101 to 149 | 36 spellings of other features are corrected (§K.9), so those specs hold the old spelling until the orchestrator applies the list | **Open; reported** |
| S1 | Size | — | `spec.md` | 35 functional requirements after the split | **Closed** |

No finding is CRITICAL. No HIGH finding stays open.

## Checks

| Check | Result |
|---|---|
| Directory | Exactly `specs/110-config-and-terms` |
| Requirement ids | F110-FR-001 to F110-FR-035 with no gap; F110-SC-001, 002, 004, 005, 006, 007; the gaps of the success criteria are in "Requirements moved to 147-terms-gate" |
| Every requirement has a test task and an implementation task | Yes |
| `python3 docs/ecosystem/check-traceability.py` | No `[h` line names feature 110 |
| Kept as-is rows | None; all 26 rows are `superseded-by` and stay here |
| No citation of the sibling | Feature 147 is named as the owner of the meaning of three keys and of closed sets 40 to 42; no requirement of it is cited |

## After two repairs

Nothing that a repair can fix remains.

## After the cross-feature review

Date: 2026-09-30. Repairs of the review items of feature 110 (13 own, 15 pointers). The
catalogue `contracts/config-keys.tsv` was rewritten first (one key per line; owners and values
under `parity` of annex X §X.7; new keys, three renamed keys; two new columns `layers` and
`profile_row`); the tables §K.3 to §K.9 and the requirements of `spec.md` follow it.

Changed in this pass, after the state the previous agent left:

- §K.8 completed: `SPECSTRIDE_AGENT_STREAM` and `SPECSTRIDE_AGENT_TAP` mapped to the keys of
  feature 126 (annex X §X.8 names them so); the six `loop.yield.*` variables of feature 118 and
  the three `SPECSTRIDE_FAILURE_*`; `SPECSTRIDE_OTEL_TRACES` and the four `RALPH_*` pairs of
  feature 128 (the two timeout variables converted from seconds to milliseconds);
  `SPECSTRIDE_PRIME_FLEET_BIN` with the one exception to F110-FR-020; the four platform
  variables `NO_COLOR`, `FORCE_COLOR`, `TERM`, `COLORTERM`, which reach no key, with the
  baseline reading of `NO_COLOR` (B-1411, B-1412).
- `contracts/alias-table.tsv` completed (one row per variable: the table of annex X §X.8, then
  the aliases of §K.8, then the variables that reach no key and those not carried);
  `contracts/README.md` describes both files and their columns.
- F110-FR-006 and the text near it: the reference for the defaults is `orchestrator.sh` at
  `9cab15d`; `.env.example` counts only where it repeats a built-in default (T002 follows).
- F110-FR-017: the parity exception of row 19 (no line without an as-is equivalent under
  `parity`; the doctor warning stays).
- §K.2: the unit suffix `Days` added (CQ-160).
- The section "Rows of the parity profile" rewritten: every key that needs a row has one (rows
  44 to 131 of annex X §X.7); `supervise.wallClockSec` spelled right; `attempt.tier_bump_after`
  named as row 128. The closed sets now carry their §X.6 row numbers (44, 45, 237 to 242; key
  classes = rows 75 and 76 of feature 100). A "Threats" table added for T-33 and T-34. The
  constraints table and the clarifications name `user:config` and `project:config`, and
  "model-tier bump" everywhere.
- `plan.md`: the validator (Ajv, the choice of feature 100) and the YAML parser (`yaml`) named;
  layer L1 of the package graph; counts updated (259 catalogue rows, 131 profile rows); the
  constitution gate names v3.0.0; the EP-10 suite and sample moved to
  `packages/testkit/src/conformance/EP-10/` and `packages/testkit/src/samples/EP-10/`.
- `tasks.md`: T002 without machine paths and on the built-in defaults; T030 in the test kit
  place; T044 added (pin `yaml`, record its licence).
- `research.md`: the dependency decisions of feature 100 (D-2 Ajv, D-8 `yaml`) restated.

Consistency pass over the places touched: every requirement of §G1 to §G3 keeps a test task and
an implementation task; the new task T044 covers F110-FR-003, which T011 also covers; the
catalogue, `config-keys.tsv`, §K.8 and `alias-table.tsv` name the same keys and the same owners;
no requirement id, task id or test name was reused (T044 appended). The counts stand at 35
functional requirements and 37 tasks (T033 to T039 stay with feature 147). The check
`check-traceability.py --require-all` passes; no `[h` line names feature 110.

## Second pass after the cross-feature review (2026-09-30)

The eleven items of section B of `docs/ecosystem/reviews/SECOND-PASS-LIST.md` were verified one by
one against the current files and against the authorities (annex X §X.7 of feature 100; the repair
reports of 116, 128, 130, 131, 134, 138, 142, 115; baseline `9cab15d`).

What changed in this pass:

- B8, the only item needing a change to a requirement: F110-FR-020 now states the narrowest
  reading of the prime launcher pair — an empty `SPECSTRIDE_PRIME_FLEET_BIN` is read as unset, as
  the pass loop reads it (`proposer.sh:609` at `9cab15d` uses `${VAR:-…}`), while the critic of the
  baseline reads only an absent variable as unset (`lib/critic.py:2196` uses `os.environ.get`). The
  sources do not settle the difference; the reading is marked `assumption: CQ-196` on the
  requirement, in §K.8, in the acceptance scenario 4 and in `contracts/alias-table.tsv` (line 97).
- B7: the further users 130 and 138 of `harnesses.<id>.proposerCustomisations` recorded in the
  `confirmed_or_corrected` cell of `contracts/config-keys.tsv` line 138 (the spec's §K.6 row
  already named them).
- A dated section "Second pass after the cross-feature review (2026-09-30)" added to `spec.md`.

Items verified and unchanged (already applied by the first pass): B1, B2, B3, B4, B5, B6, B9, B10.
B11 is a defect of feature 100's `research.md` and is not edited from this feature.

Consistency pass over the places touched: the empty-value reading is the same sentence in
F110-FR-020, §K.8 and `alias-table.tsv`, and acceptance scenario 4 exercises it through the same
test family `PT-110-alias-*` (tasks T005, T021, T026 cover it; no new task needed). The key list,
the spec tables of §K.5 and §K.6 and annex X §X.7 rows 17, 32, 46, 97, 98, 101, 104, 105, 131
agree on owners, defaults, trust classes and values under `parity`. No id was renumbered or
reused. Counts stand: 35 functional requirements, 6 success criteria, 37 tasks (T033 to T039 stay
with feature 147). One new queued question, CQ-196 (see the repair report). The check
`check-traceability.py --require-all` passes after the change; no `[h` line names feature 110.

## Third analysis run (speckit-analyze, 2026-09-30, after the B-8.7 re-check)

Fresh cross-artifact analysis after `spec.md` and `plan.md` changed at 13:22 (the B-8.7 re-check:
F110-FR-019 and the layers of `distribution.audience`). Scripted checks: the key set of the spec
tables §K.3 to §K.6b against `contracts/config-keys.tsv` (diff empty after the repair below),
TSV duplicate and row counts, the 226 env items of R18, every DV id cited, every §K.8 alias in
`alias-table.tsv`, and the mapping of all 30 test ids (CT-110-101 to CT-110-130) between `spec.md`
and `tasks.md`.

Findings and repairs of this run:

- I1 (HIGH, repaired): `contracts/config-keys.tsv` held 262 rows against the 259 keys of the
  catalogue — three orphan rows for withdrawn spellings (`fallback.after`,
  `loop.parallel.tasks.<taskId>.eligible`, `loop.parallel.tasks.<taskId>.writes`), each already
  recorded as `corrected (old: …)` on its standing key (lines 96, 97, 242). They made T004's
  derive-and-fail check unsatisfiable as shipped and contradicted F110-FR-010 (rows with no
  class, owner or default). The three rows were removed; the file now diffs empty against the
  spec tables.
- A1 (LOW, repaired): T004 and `contracts/README.md` now say "§K.3 to §K.6b" (the 78 proposed
  keys of §K.6b are derived too) and state that old spellings live in the
  `confirmed_or_corrected` column, never as a row of their own.
- D1 (LOW, repaired): `repair-report.md` added to the documentation tree of `plan.md`.
- T1 (LOW, reported only): the Constitution Check of `plan.md` cites "Phase 0"/"Phase 1", which
  no artifact defines (the phases are those of `tasks.md`). Left as is.

Coverage after the run: 35 of 35 requirements with tasks (100 per cent), all six success
criteria with tasks, 30 of 30 test ids mapped, no unmapped task beyond the setup and polish ones
(T003, T040 to T043). No duplication, no ambiguity beyond the recorded assumptions (CQ-156 to
CQ-159, 160, 183, 196, 205), no constitution violation. Counts stand: 35 functional requirements,
6 success criteria, 37 tasks.
