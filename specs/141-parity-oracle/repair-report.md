# Repair report — feature 141 (141-parity-oracle), act B-8.6c

Date: 2026-09-30. Every item was verified against the files before it was applied; the line numbers
of the worklist had moved and are given here as they are now.

## Items

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-141-01 | queue | medium | Applied | `spec.md` §Requirements F141-FR-002 (new rule and `assumption: CQ-193`), F141-FR-033 (assumption), §Clarifications table (`CQ-pending-141-1` → CQ-193) | Verified first: the placeholder stood at `spec.md:1015` (worklist said 1013) and in the assumptions of F141-FR-002's neighbours. The recommended answer was already the reading of the requirement; the new sentence in F141-FR-002 makes it a rule |
| W-141-02 | queue | medium | Applied | `spec.md` §O.2 FX-33 pattern source (line 207), F141-FR-030 assumption (line 765), §Clarifications table (`CQ-pending-141-2` → CQ-194); `contracts/fixture-catalogue.json` (source of FX-33, regenerated) | The ten validators stand; feature 107 must state them as a closed set (see below) |
| W-141-03 | repair | low | Applied | `contracts/register-map.json`, entry DV-029 (`gate:<phase>:approved` → `gate:<N>:approved`) | The register row DV-029 in `consolidation.md` carries the same `<phase>` and is not mine to write; `generate.py --check` fails on that row until the orchestrator corrects it |
| W-100-14 (pointer) | repair | medium | Not applied — nothing to change | — | Verified with a search over the whole feature: every occurrence of "iteration" is one of the literals `iteration-limit`, `iteration-returned-by-yield`, `MAX_ITER`, `iter_*`, `giveIterationBack`. No "iteration limit" or counted-iteration wording exists |
| W-100-26 (pointer, CQ-186) | queue | medium | Applied | `plan.md` Technical Context and the re-check after Phase 1 | The plan now states that Python 3 is a requirement of development and that no Python file is in a published package. The tasks T003, T082 and T086 need no change on the recommended answer: the generator is a tool of the specification and the tracing runs inside the reference |
| W-X-05 (pointer) | repair | medium | Applied | `spec.md` (F141-FR-023: DV-001 to DV-117; two answers of §Clarifications; assumptions: 117 on 2026-09-30; inventory 2,785; profile rows 1 to 131), `plan.md` Scale/Scope, `contracts/README.md`; `contracts/register-map.json` gained DV-114, DV-115, DV-116, DV-117 | The worklist cited "DV-001 to DV-094" at `spec.md:826`; the text now said DV-113 and is written as DV-117. The four new entries were required by F141-FR-023 itself, because the register had grown to 117 rows; without them the feature's own check fails |
| W-X-06 (pointer) | repair | medium | Applied | `spec.md` §O.2 row FX-11, F141-FR-035 | The worklist cited `spec.md:101` "a second engine start while the lock is held"; the text actually held "a second run" in two places, both changed to "a second engine start" |
| W-X-13 (pointer) | repair | medium | Applied | See W-141-01 and W-141-02 | Both placeholders of the feature replaced by the real numbers |
| W-X-18 (pointer) | repair | medium | Applied | `spec.md` §Requirements: `ep:` line on F141-FR-010 (EP-02, consumes), F141-FR-019 (EP-08, consumes), F141-FR-039 (EP-04, consumes) | The worklist cited `spec.md:757-759`; the table stands at `spec.md:899-901`. The requirement that uses each point was read before the line was added |
| W-100-16 (pointer) | repair | medium | Applied | `contracts/schemas/*.json` (`$id`, six files), the `schema` field of the seven data files and the `const` that four schemas pin; `contracts/tools/generate.py` (the id it writes); `contracts/README.md` (the rule stated) | Internal form `urn:specstride:schema:internal:141:<name>/<major>`, as feature 108 used for its schemas; the oracle is never shipped |
| CQ-187 (from the state of the feature) | — | — | Noted | — | The question on the missing critic credential is feature 141's in the queue map; register row DV-117 (written in act B-8.6) carries the recommended answer and the map entry cites CQ-187. The question stays open for the owner; nothing in this feature changed for it |

## Requirements added or changed in place

| Requirement | Change | Item |
|---|---|---|
| F141-FR-002 | New sentence: a fixture MUST NOT change the reference tree, shadow the interpreter, or make a file of the reference missing or unwritable to reach a line; such an item goes to the correction list. `assumption: CQ-193` | W-141-01 |
| F141-FR-012 | New sentence and `divergence: DV-116`: the source inventory of a reverse run is compared under DV-116, whose handling the feature confirms (the field `schema` of the port is removed by a normalization rule before the comparison on FX-30; the rule itself is data of feature 100, requested by report) | Extra change of act B-8.6 (feature 108) |
| F141-FR-010, F141-FR-019, F141-FR-039 | `ep:` line each (EP-02, EP-08, EP-04, all consumes) | W-X-18 |
| F141-FR-023 | The register range is DV-001 to DV-117 on 2026-09-30 | W-X-05 |
| F141-FR-030 | The assumption names CQ-194 | W-141-02 |
| F141-FR-033 | The assumption names CQ-193 | W-141-01 |
| F141-FR-035 | "a second engine start" | W-X-06 |

No new requirement was added, so no new test or test task was needed; the count stays 45
functional requirements, at the split mark and not above it. The section "Repairs after the
cross-feature review (2026-09-30)" at the end of `spec.md` lists every change.

## What another feature or the orchestrator must do

1. Orchestrator: correct the register row DV-029 in `docs/ecosystem/consolidation.md`: the logical
   name is `gate:<N>:approved`, as annex B §B.5 writes it, not `gate:<phase>:approved`. Until then
   `generate.py --check` of this feature fails with "DV-029: the text of the register changed".
2. Feature 107: state the ten validators of the launch-contract validation as a closed set
   (W-141-02, CQ-194) and report it to the orchestrator for annex X §X.6.
3. Feature 100: a new normalization rule is needed for DV-116 — the key `schema` is removed from
   the source inventory before it is compared on FX-30. The rule is a row of annex X §X.8, which
   this feature does not write; the register map carries the handling and awaits the rule.
4. Orchestrator: the register row DV-115 asks this feature to confirm "not observable"; confirmed
   here: no fixture of the catalogue makes the local append of an event fail, so the row stands as
   written (own test remains CT-126-11 of feature 126).
5. Orchestrator: the register row DV-034 changed in act B-8.6 (ruling 68); the map follows it.
   No other feature is affected.

## New questions (each with a recommended answer and its source)

None. The two queue items of the feature are CQ-193 and CQ-194, already in
`docs/ecosystem/CLARIFY-QUEUE.md`; the specs proceed on their recommended answers and the changed
requirements carry `assumption: CQ-193` / `assumption: CQ-194`. Both stay open for the owner.

## Register rows needed (with the text)

No new row is needed. The map of this feature now holds all 117 rows, DV-001 to DV-117, with the
text of the register of 2026-09-30. Two rows ask for small register-side corrections, given above
(DV-029: `gate:<N>:approved`; DV-116: the normalization rule of feature 100 that the handling
names).

## Checks

- `python3 specs/141-parity-oracle/contracts/tools/generate.py --check`: one FAIL remains,
  "DV-029: the text of the register changed" — cause in `consolidation.md`, not in this feature
  (item 1 above). Everything else passes: 40 families, 39 active, 248 scenario names (13 patterns,
  175 members; 14 names of other features), 34 with an end on the reference, 117 register rows,
  55 requirements (45 FR, 10 SC).
- `python3 docs/ecosystem/check-traceability.py --require-all`: PASSED, checks a to h.
