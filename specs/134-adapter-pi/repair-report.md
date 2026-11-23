# Repair report — 134-adapter-pi

Dated 2026-09-30. All paths are relative to `specs/134-adapter-pi/` unless they start with `specs/` or `docs/`.

State: done. Every item of the section of feature 134 in `docs/ecosystem/reviews/REPAIR-WORKLIST.md` was verified against the files before it was applied.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-134-01 | `repair` | medium | done | `spec.md` (requirements F134-FR-005, -021; the acceptance scenario of US3; an edge case; the out-of-scope table; the EP-11 row; two clarifications), `plan.md` (facts table, D1, D2), `tasks.md` (T022, T024), `data-model.md` (descriptor row), `research.md` (row 11), `contracts/descriptor.pi.json` (3 places), `contracts/conformance-cases.json` (2 places) | Verified: 19 uses of "back end" stood, more than the 14 the item lists. "Provider" replaces it everywhere except the verbatim `**Input**` quotation of the brief at `spec.md:9` (a record of the brief's wording) and the literal "loopback endpoint", which only contains the substring |
| W-X-01 | `repair` | high | done | `plan.md` (Primary Dependencies, Project Type, source tree), `tasks.md:17`, T007, T018, T028 | Verified against `specs/100-specstride/contracts/data/package-graph.json`: the package of this feature is `@specstride/adapter-pi` (owner 134) and the reader is imported from `@specstride/adapter-prime` (the graph's note: feature 138 decides and the graph follows). The dialect row now sits at `packages/adapter-pi/data/dialects/pi.json` and T028 registers it with the reader of feature 138 |
| W-100-23 | `queue` | medium | done (CQ-183) | `spec.md` (F134-FR-009) | F134-FR-009 now reads "in the user configuration only, never in the environment and never as a flag", with `assumption: CQ-183` |
| W-110-05 | `repair` | medium | done (CQ-183) | `spec.md` (F134-FR-008) | The opt-in to C0 is accepted from the user configuration only, said in so many words: not the environment, not a flag, not project configuration; `assumption: CQ-183`, as feature 100 wrote F100-FR-111 |
| W-110-09 | `repair` | medium | done | `spec.md` (F134-FR-029, the profile table row 131, the settings table) | The key is named: `harnesses.<id>.proposerCustomisations`, for pi `harnesses.pi.proposerCustomisations`, row 131 of annex X §X.7, as feature 100 added it (its repair table, row 16). Reported to feature 110 in "What another feature must do" |
| W-127-02 | `repair` | medium | done | `contracts/classifier-entries.pi.json` | Verified against §Q.1 of `specs/127-quota-budgets-and-pause/spec.md` and `classifier.table.json`: the six named entries already carried the per-class `retryable` values of §Q.1 (`quota_window` true, `quota_credit` false, `rate_limit_transient` true, `overload` true, `auth` false, `context_window` false); the default row `provider_other` had none and now carries `retryable: true` |
| 127 alignment (extra change of 2026-09-30) | — | — | done | `contracts/classifier-entries.pi.json` | The same edit as W-127-02: the default row's `retryable: true` is the alignment with the per-class `retryable` of feature 127, §Q.1 ("an entry that states no value takes the value of this table") |
| W-X-05 | `repair` | medium | done | `spec.md` (the clarification on the register count) | Verified: the register in `docs/ecosystem/consolidation.md` holds 117 rows, DV-001 to DV-117, on 2026-09-30 (the checker's `N_REGISTER` agrees; feature 100's repair report says 113, which was true when it was written). The clarification now says 117 and dates the count |
| W-X-10 | `repair` | medium | done | `spec.md` (the clarification on the descriptor name), `plan.md` (Storage) | Verified: `package:harness:<id>` is a row of annex B §B.5 (`specs/100-specstride/annexes/B-state.md:250`). Both places now cite annex B §B.5 and no longer call the name a proposal of feature 109 |
| W-X-16 | `repair` | medium | done | `spec.md` (out-of-scope table, the assumptions), `plan.md` (terms-facts row, source tree), `tasks.md` (T025, the dependencies) | The terms gate, the terms file and the audience are feature 147's; feature 110 stays for the secret resolvers (`spec.md`, assumptions). The lines the item names are in `spec.md`; the repeats in plan and tasks were carried with it |
| W-X-17 | `repair` | medium | done | `spec.md` (new F134-FR-030, the row in "Contracts of feature 100 used"), `plan.md` (row III of the Constitution Check, Scale/Scope), `tasks.md` (new T039), `contracts/traceability.json` | New requirement **F134-FR-030** in the form of F130-FR-030: the critic-diversity rule and its warning are those of feature 100 (F100-FR-024), the warning is recorded and does not block a run, the provider and model of every call are recorded for the diversity test, and the unknown-terms bar of F134-FR-005 stands beside it. Test CT-134-30, task T039 with `proves: F134-FR-030`. `specs/130-adapter-dsh/spec.md:409` was read as the model; no file of another feature was edited |
| W-X-19 | `repair` | medium | done | `spec.md` (F134-FR-010 `ep:` line, the EP-14 row of "Extension points") | Both places now read `implements (an entry)` for the registration of the doctor checks. EP-01 in 129 is not used by this feature, so no second place exists |
| W-X-28 | `repair` | low | done | `plan.md` (test tree), `tasks.md` (all task paths) | The test directories of feature 100 are used: `tests/characterization/134/`. This feature has no parity test (feature 141 §O.7), so `tests/parity/134/` stays empty and the plan says so |

## Requirements added or changed in place

| Requirement | Change | Item |
|---|---|---|
| F134-FR-005 | "back end" → "provider" (5 places) | W-134-01 |
| F134-FR-008 | The opt-in to C0 comes from the user configuration only; `assumption: CQ-183` added | W-110-05 |
| F134-FR-009 | `loop.parallel.allow_detect` from the user configuration only; `assumption: CQ-183` added | W-100-23 |
| F134-FR-010 | `ep: EP-14` becomes `implements (an entry)` | W-X-19 |
| F134-FR-021 | "back end" → "provider" (4 places) | W-134-01 |
| F134-FR-029 | The opt-in key `harnesses.<id>.proposerCustomisations` (row 131) named; parity lines name rows 29 and 131 | W-110-09 |
| F134-FR-030 | New: the critic-diversity rule and its warning, in the form of F130-FR-030; test CT-134-30; task T039 | W-X-17 |

Requirement count: 30 functional (`F134-FR-001` to `F134-FR-030`), 7 success criteria. Below the split threshold of about 45; no split.

## What another feature or the orchestrator must do

- **Feature 110**: the opt-in key for the auto-loaded context of pi is `harnesses.<id>.proposerCustomisations` (row 131 of annex X §X.7, feature 100's proposal). It goes into the key list of 110; 110 owns the final spelling.
- **Feature 147**: this feature hands the terms facts of pi (`terms-facts.json`, R8v rows 37 to 40) to the terms file of 147, not to 110 (W-X-16).
- **Feature 112**: unchanged — it still owns the ids of the five doctor checks (CQ-108).
- **Orchestrator**: none of the repairs needed a new divergence register row (DV-047, DV-002 and the rows already cited cover the changes), and no new question was opened.

## New questions (each with a recommended answer and its source)

None. Every item of this feature applied under an existing number (CQ-183) or needed none.

## Register rows needed (with the text)

None. No new divergence was introduced; the repairs narrow or align existing behaviour.

## Checks

- No generator or check of this feature exists under `contracts/tools/` (the directory does not exist here; the generator belongs to feature 100), so none was run.
- `python3 docs/ecosystem/check-traceability.py --require-all`: **PASSED**, checks a to h (41 of 41 Wave 1 features have a spec; register rows cited: 60 of 117).
- The JSON of every touched contract file parses (`descriptor.pi.json`, `conformance-cases.json`, `classifier-entries.pi.json`, `traceability.json`).
- Consistency pass over spec, plan and tasks for the touched places: recorded in `analyze-report.md`, section "After the cross-feature review". Nothing failed.
