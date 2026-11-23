# Repair report — 117-critic-grounding-and-prompt

Date: 2026-09-30. No item of its own; ten pointers, the table of feature 100, and W-X-23 by order of the orchestrator.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-100-25 (CQ-185) | queue | medium | done | `plan.md` Summary, Technical Context, tree, Structure Decision; `tasks.md` T009, T076, T077, T092 to T095; `research.md` D-16 | Verified: the plan said the hiding uses write calls of the file system. Now a file-reading port and a file-moving port; records through the atomic write of the kernel. Marked `assumption: CQ-185` in plan and tasks. No requirement text changes |
| W-X-05 | repair | medium | done | `spec.md` Assumptions | Verified: "97 rows". The register has 113 rows; it is now named without a count |
| W-X-07 | repair | medium | done | `plan.md` row XVIII, Complexity Tracking, Storage, physical paths; `research.md` D-6, D-7, D-11; `quickstart.md` row 7; `tasks.md` T086 to T088; `spec.md` Closed sets, CQ-059 and CQ-060 rows | Verified: DV-099 and DV-100 exist (`consolidation.md:998`, `:999`). Also stale and repaired: the three names of annex B §B.5 and the closed sets (rows 115 to 122 of annex X §X.6) exist |
| W-X-08 | repair | medium | done | `plan.md` row XVIII | The list is complete: 13 rows, and the reference to the `divergence:` fields |
| W-X-11 | repair | medium | done | `spec.md` F117-FR-001, -002, -016, -024, -029, table of rows; `contracts/parity-rows.json`; `contracts/README.md`; `plan.md` | Rows 52 to 58, verified in annex X §X.7 and in the key list of feature 110 (`confirmed`). Defaults of rows 52, 55 and 56 brought to the annex |
| W-X-14 | repair | medium | done | `plan.md` after row XIX | Gate line added |
| W-X-18 | repair | medium | done | `spec.md` F117-FR-004, F117-FR-021, F117-FR-033 | `ep:` lines for EP-03, EP-18, EP-04 |
| W-X-25 | repair | medium | done | `spec.md` F117-FR-004, F117-FR-005, F117-FR-040, F117-FR-042, Key Entities, contracts table | The three names of this feature are named. `pass:<passId>:critic-patch`: see next row |
| W-X-25, `pass:<passId>:critic-patch` | repair | medium | not applied as a writer | `spec.md` Out of scope | Annex B §B.5 (`B-state.md:258`) names the harness adapter as the one writer, and the worklist gives the name to feature 130. Feature 117 neither writes nor reads it; it is named under "Out of scope" with its writer |
| W-X-26 | repair | medium | done | `contracts/schemas/hidden-files.schema.json` (new); `data-model.md`; `contracts/README.md` | `$id` `urn:specstride:schema:specstride.hidden-files/1`; `schema` required |
| W-X-30 | repair | low | done | `tasks.md` T001, T004 | |
| W-X-23 | repair | medium | done | `spec.md` F117-FR-043, F117-FR-044 (new), contracts table; `tasks.md` T056, T060, T096, T097; `research.md` D-17 | Not a pointer of the worklist for 117; applied by order of the orchestrator. The ingress is cited as F100-FR-009 and F100-FR-205, not as a requirement of feature 111 (a tier 2 feature cites feature 100) |
| Table of feature 100, row 3 | — | — | done | `spec.md` Out of scope; `data-model.md` | Content owner of the fact block: 116 |
| Table of feature 100, row 35 | — | — | done | `plan.md`, `tasks.md` T071, T094 | Samples under `packages/testkit/src/samples/EP-02/` |
| Table of feature 100, rows 23, 24, 39, 40 | — | — | not applied | — | No use of "same-model warning", "iteration" or of the two counts in feature 117 |

## Requirements added or changed in place

| Requirement | Kind | What |
|---|---|---|
| F117-FR-001, -002, -016, -024, -029 | changed | `parity:` names the row number |
| F117-FR-004, -021, -033 | changed | `ep:` lines |
| F117-FR-004, -005 | changed | `gate:<N>:proofs` |
| F117-FR-040 | changed | Logical name and record `specstride.hidden-files/1`; the record is written before the first move |
| F117-FR-042 | changed | Logical name `attempt:<N>:<k>:<n>:withheld-paths` |
| F117-FR-043 | changed | The one ingress; no second call of the redactor |
| F117-FR-044 | added | Outside text written to a sink enters through the one ingress. Test CT-117-44, task T096 |

Tasks added: T092 to T097. Now 44 functional requirements, 7 success criteria, 97 tasks.

## What another feature or the orchestrator must do

1. Feature 100 or the orchestrator: decide where the two file ports of grounding and hiding live. F100-FR-234 names three edge interfaces in Wave 1 (116, 143, 148) and none for this. The plan declares the types in the core and places the implementation in `packages/runtime/src/ports/critic-input-files.ts` (composition root, owner 122). Feature 122 must know of it, or the interface moves into the `contracts` package and the implementation into an edge package.
2. Feature 100 / feature 111: F100-FR-009 cuts text at the ingress "to a size cap". Under `parity` the cap must not be below the as-is sizes that reach the critic prompt (phase evidence up to 60000 characters; a grounding budget of 327680 bytes at a window of 200000 tokens), or FX-25 differs. Feature 117 cannot state the cap.
3. Feature 141: the catalogue lists feature 117 under FX-25 only; the tests of 117 also use FX-02, FX-05 and FX-08 (finding F1 of the analyze report, unchanged).
4. Feature 126: `F126-FR-016` cites `DV-new-1`; the coverage check fails on it.

## New questions (each with a recommended answer and its source)

None. The place of the file ports (point 1) is within CQ-185; recommended answer: the interface in `@specstride/contracts`, the implementation handed in by the composition root (F100-FR-234).

## Register rows needed (with the text)

None.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None exists |
| `python3 docs/ecosystem/check-traceability.py --require-all` | FAILED with 1 error, on another feature: `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)`. No line names feature 117; 102 of 102 items kept |
| JSON files of `contracts/` | Parse |
| Every requirement has a task; every test name has a task | 44 of 44; 55 of 55 |
| Placeholders (`CQ-pending-*`, `DV-new-*`, P-n, working names, machine paths) | None left |
