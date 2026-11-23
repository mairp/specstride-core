# Repair report — 106-learning (act B-8.6c, 2026-09-30)

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-106-01 | repair | high | done | `plan.md` (Primary Dependencies, Project Type, Structure Decision, tree); `research.md` D-9; `tasks.md` T079 | Verified: the package graph gives `@specstride/learning` layer L1, mayImport `@specstride/contracts` and `@specstride/kernel`. L3 written L1 in the four places; `@specstride/kernel` (atomic write, hasher) added to Primary Dependencies; T079 now refuses what the import-boundary check of feature 100 refuses |
| W-106-02 | repair | low | done | `spec.md` F106-FR-021 and the assumption table; `data-model.md` event table | Verified: baseline emits five event kinds, but the catalogue of feature 111 (`event-catalogue.tsv` rows 96 to 99, reached through annex X §X.6 row 73) holds four learning types (`learning.observed`, `learning.knob_adjusted`, `learning.knob_auto_reverted`, `learning.knob_evaluated`); the fifth as-is kind (`events_tampered`) is in the catalogue as `integrity.events_changed` (row 95) and is not a learning event. Four, not five; as-is names are the projection. No fifth type to report to the orchestrator |
| W-106-03 | repair | low | done | `spec.md` Constraints, F106-FR-030 | Verified against ruling 10 and F100-FR-167. Reworded as rank 1 of the order of configuration (the pin), applying to children of the runtime root only; the same fault in F106-FR-030 ("the one named exception") carried in place |
| W-104-01 | repair | high | done (pointer) | `plan.md` Primary Dependencies | Now "the canonical hasher of feature 104 in `@specstride/kernel`" (confirmed by feature 104's repair report, which named this exact sentence) |
| W-100-14 | repair | medium | done (pointer) | `spec.md` F106-FR-019, F106-FR-036 | The two "pass cap" occurrences are now "pass limit"; no other occurrence in the feature |
| W-X-07 | repair | medium | done (pointer) | `plan.md` Constitution Check row XVIII | DV-105 exists (`consolidation.md:1004`); the row now states it as the present row, not "reported for a register row" |
| W-X-09 | repair | medium | done (pointer) | `plan.md` Constitution Check row XVII; `tasks.md` T085 | Row XVII answered as a pass with a test reason (tiering, skips with reason, macOS `unverified`); T085 records it |
| W-X-13 | repair | medium | done (pointer) | `spec.md` F106-FR-021, assumption table; `research.md` open readings | The placeholder `CQ-pending-4` is replaced by the settled citation of the catalogue through annex X §X.6 row 73. Also settled in place: CQ-114 (annex B §B.20 holds the row) and CQ-115 (annex B F100-FR-228). No question stays open |
| W-X-14 | repair | medium | done (pointer) | `plan.md` Constitution Check gate line | The check now names `.specify/memory/constitution.md` v3.0.0 |
| W-X-23 | repair | medium | done (pointer) | `spec.md` new F106-FR-040; `tasks.md` T084; F106-FR-021 sentence | Free text of the learning stream passes the one ingress (F100-FR-205, LR-9) before it is written; new requirement with test `PT-106-FR040-ingress` and task T084 (`proves: F106-FR-040`) |
| W-X-25 | repair | medium | done (pointer) | `spec.md` F106-FR-038 and its assumption | The lock is named `feature:<slug>:learning:lock` (annex B §B.5, line 259); the stale assumption "no logical name in annex B (reported)" is corrected |
| W-X-26 | repair | medium | done (pointer) | `data-model.md`; `spec.md` F106-FR-034; `contracts/README.md`; new `contracts/schemas/retrospective.schema.json`; `tasks.md` T068 | "proposed" removed; the row of annex B §B.20 (owner 106) is cited; the schema file is delivered with `$id: urn:specstride:schema:specstride.retrospective/1` and `schema` required (form of the contracts README, W-100-16). T068 no longer asks feature 100; it delivers the file |
| W-X-27 | repair | medium | done (pointer) | `plan.md` Primary Dependencies | The validator is named: the one Ajv of feature 100's D-2; no YAML parser named, because the feature reads no YAML (the one parser is the configuration loader of feature 110) |
| W-X-28 | repair | low | done (pointer) | `plan.md` structure; `tasks.md` Format line, T002, and 42 test paths | Tests move to `tests/parity/106/` and `tests/characterization/106/` (row 36); the static and contention tests run in `tests/characterization/106/` |
| W-X-29 | repair | low | done (pointer) | `plan.md` Constitution Check row XIX; `tasks.md` T086 | Figure stated: the default output of `learn --show` for one feature stays under 2,000 bytes; T086 measures it with the helper of T194 of feature 100 (`packages/testkit/src/static/budget.ts`) |

## Requirements added or changed in place

- **F106-FR-040** (new): text from outside the runtime passes the one ingress (F100-FR-205, LR-9) before learning writes it. Test `PT-106-FR040-ingress`; task T084. Counts: 40 functional requirements (was 39), 10 success criteria, 86 tasks (was 83). Still under the limit of about 45: no split.
- **F106-FR-021** changed in place: catalogue event types, four not five, as-is names as projection; `CQ-pending-4` replaced.
- **F106-FR-030** changed in place: the pin is rank 1 of the order of configuration, not an exception (W-106-03 carried).
- **F106-FR-034** changed in place: the schema id is settled (annex B §B.20); the schema file is named.
- **F106-FR-037** changed in place: the tamper event is `integrity.events_changed`, as-is name `events_tampered` as the projection.
- **F106-FR-038** changed in place: the lock is named by its logical name; the stale assumption corrected.
- **F106-FR-019, F106-FR-036** changed in place: "pass cap" → "pass limit".
- `spec.md` gains the section "Repairs after the cross-feature review" (dated 2026-09-30) with one line per requirement.

## What another feature or the orchestrator must do

- Nothing blocking. For information: feature 111's catalogue settles the event types (rows 96 to 99 plus row 95); feature 104 owns the hasher; feature 107 consumes the binding rules unchanged; feature 110 names the one YAML parser, which this feature does not use.
- The orchestrator commits the files above; the scratch convention was not needed.

## New questions (each with a recommended answer and its source)

- None raised. The three open readings CQ-113, CQ-114, CQ-115 remain as recorded; CQ-114 and CQ-115 are closed by the present annexes (§B.20 and F100-FR-228) and are marked settled in the spec and `research.md`.

## Register rows needed (with the text)

- None. DV-105 already covers the unknown mode value; no repair of this act adds a divergence.

## Checks

- `contracts/tools/`: this feature has no generator or check of its own — nothing to run.
- `python3 docs/ecosystem/check-traceability.py --require-all`: **PASSED** (checks a to h; 41 of 41 Wave 1 features have a spec).
- `specs/106-learning/analyze-report.md`: dated section "After the cross-feature review" appended, with the consistency pass over the touched places.
