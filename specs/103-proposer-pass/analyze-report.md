# Specification Analysis Report: feature 103-proposer-pass

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `tasks.md`, the constitution v3.0.0. The analysis ran once after the repairs below; mechanical checks are `docs/ecosystem/check-traceability.py` and searches.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| I1 | Inconsistency | LOW | `plan.md`, `quickstart.md` | "22 clusters" where the traceability files give 20 | **Repaired** |
| I2 | Inconsistency | LOW | `quickstart.md` | A register row (DV-044) was listed that the spec does not cite | **Repaired** |
| G1 | Terminology | LOW | `spec.md` | Bare "hook", "attempt", "obligation" in a few sentences | **Repaired** ("call points", "phase attempt", "verification obligation") |
| U1 | Underspecification | MEDIUM | F103-FR-039, F103-FR-021, F103-FR-042, F103-FR-037 | Four readings the sources do not settle, CQ-066 to CQ-069 | **Open by design**; each proceeds on the recommended answer |
| U2 | Underspecification | MEDIUM | F103-FR-037 | The length of an index title is a parameter with no value in any source | **Open**; set by experiment X3 (research D-13) |
| F1 | Inconsistency | MEDIUM | Feature 100 annex E §E.4, annex C §C.2, annex X §X.7 | Three gaps: no pass-loop result for a stop before a pass; no cache-lifetime field of a session; no profile row for the structured-path breaker or the carry-over parameters | **Open; reported** |
| F2 | Coverage | LOW | traceability files | B-0540, B-0541, B-0558 (short-pass nudge) are assigned to 118 while the brief lists the nudge in scope; B-0563 and B-0764 are assigned to 130 | **Open; reported**; no claim made on them |
| C1 | Coverage | LOW | tasks | Every F103-FR and F103-SC id appears in a `covers:` or `proves:` line; all 20 clusters and 028 FR-018 are proved | No issue |
| K1 | Constitution | — | `plan.md` | Twenty principles answered; X, XIV, XV and XVII are not applicable, with reasons | No issue |
| S1 | Size | LOW | `spec.md` | 43 functional requirements, below the split mark of about 45 | No split proposed |

No finding is CRITICAL or HIGH.

## Additional checks

| Check | Result |
|---|---|
| Directory | Exactly `specs/103-proposer-pass` |
| `check-traceability.py` | No line that starts with `[h` names this feature; h1, h2 and h3 pass for all 106 items and 028 FR-018 |
| Requirement ids | F103-FR-001 to F103-FR-043 and F103-SC-001 to F103-SC-009, sequential; every id starts with F103 |
| Every requirement has `test:` | Yes |
| Placeholders | No `[NEEDS CLARIFICATION]`, no `DV-new` |
| The machine-specific backend | Not named anywhere |
| Register rows cited | All within DV-001 to DV-097 |

## Coverage Summary

43 functional requirements and 9 success criteria; 68 tasks; 100 per cent of requirements have at least one task; 21 parity tests and 22 characterization or conformance tests.

## Next Actions

Proceed to the cross-feature review. Answer CQ-066 to CQ-069; add rows 44 and 45 to the `parity` profile; decide the three gaps of feature 100.

## After the cross-feature review

Dated 2026-09-30. The repair of the worklist section "Feature 103" (1 own item, 10 pointers). All changes are inside `specs/103-proposer-pass/`.

| Item | What changed |
|---|---|
| W-103-01 | F103-FR-018 changed in place and `contracts/result-map.json` (rows 8 and `declared-block`): the result 8 is `declared-block` only when a declaration of the proposer or a question of the harness was seen in the counted passes; otherwise `proposer_no_progress`, `retryable: false`, state `failed` |
| W-X-02 | Conformance suites and samples moved to `packages/testkit/src/conformance/EP-04/`, `EP-15/` and `packages/testkit/src/samples/EP-04/`, `EP-15/` in plan, tasks (T050 to T056, T061) and quickstart |
| W-X-03 | Rows 44 and 45 became rows 59 and 60 of annex X §X.7 (F103-FR-018 parity line, the Configuration keys table, research D-6 and the carry-over decision); "is needed" dropped; T004 closed as verified |
| W-100-14 | Verified, no change: the feature already writes "pass limit" and "pass count"; "iteration" survives only in the assumption line and the literals |
| W-X-05 | The stale count of register rows (94) replaced by a reference to `consolidation.md` section 6 without a count |
| W-X-07 | The owners of `@specstride/core` in plan stated as the package graph gives them today: 101, 149, 103, 117, 118, 102 |
| W-X-09 | Row XVII answered as a pass with its reason; new task T087 records the macOS result of T082 as `unverified` with its reason and every skip with its reason |
| W-X-20 | New task T085 for CT-103-134 (no task existed); every other `test:` name of the spec appears in a task |
| W-X-22 | New section "Threats" in `spec.md`: T-08 controlled by F103-FR-030, T-31 by F103-FR-039 |
| W-X-24 | `progress.swept` named in F103-FR-016; new F103-FR-044 names `task.planned` and `task.ticked` (test CT-103-144, task T086) |
| W-100-16 | `$id` of both schema files is now `urn:specstride:schema:internal:103:pass-loop-<name>/1` |

### Consistency pass over the places touched

- Every requirement has a `test:` line; F103-FR-044 (new) has CT-103-144 and task T086; the `progress.swept` sentence of F103-FR-016 is exercised by its existing test PT-103-C-058-* and implemented by T017 (extended).
- No task without a requirement: T085 to T087 carry `covers:` lines. No requirement without a task: the coverage check (`check-traceability.py --require-all`) passes, checks a to h.
- Terms and values checked between spec, plan and tasks after the edits: rows 59 and 60, the EP-04/EP-15 suite and sample paths, the `declared-block` condition (spec, `result-map.json`, T012), and the owners of `@specstride/core` agree everywhere.
- The historical answer in "Clarifications" that reports "row 44" is left as the dated record of the session of 2026-09-29; the binding rows are 59 and 60.
- Count now: 44 functional requirements (F103-FR-001 to F103-FR-044) and 9 success criteria; 71 tasks.

## Second analyze run

Dated 2026-09-30, after the cross-feature review and the constitution patch v3.0.1. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, the constitution v3.0.1, `contracts/result-map.json`, and the annexes B, C, E and X of feature 100 for the open assumptions. Coverage before the run: 44 FR, 9 SC, 71 tasks, 100 per cent. No CRITICAL or HIGH finding. All 17 findings were repaired on the same day at the owner's instruction; the repair record of the spec is the section "Repairs after the analyze run of 2026-09-30".

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| I1 | Inconsistency | MEDIUM | `spec.md` Edge Cases vs F103-FR-018 | The edge case still ended every structured-path firing in `blocked-on-human`; W-103-01 made it two branches | **Repaired** |
| I2 | Inconsistency | MEDIUM | F103-FR-019 vs F103-FR-021, `result-map.json` | FR-019 mapped result 3 to exit 1 while FR-021 and the contract map `blocked: source-changed` to exit 3; the precedence was only in the contract | **Repaired**: FR-019 states that `blocked` is mapped first |
| I3 | Inconsistency | MEDIUM | CQ-067, CQ-068 | Both assumptions were stale: annex E §E.4 row 3 of the table "Pass loop" and `continuation.cacheTtlSec` of annex C §C.2 now exist | **Repaired**: closed in spec, research |
| I4 | Inconsistency | MEDIUM | `plan.md` Principle VI vs T003 | The plan claimed schemas of the request, result and handoff in `contracts`; T003 put two in the core and none existed for the handoff | **Repaired**: request and result stay internal to the core (no boundary); the handoff gets `packages/contracts/schemas/handoff.schema.json` (T003) |
| C1 | Coverage | MEDIUM | T051, T052, T061 | No task built the sample layers and the sample provider that Principle VI requires outside the core | **Repaired**: T058, T068 |
| U1 | Underspecification | MEDIUM | Threats T-08 vs F103-FR-030 | The control of T-08 stood only in the Threats table, with no requirement and no test | **Repaired**: FR-030, CT-103-145, T088 |
| U2 | Underspecification | MEDIUM | F103-FR-035 | The harness window is in tokens and Lisa's caps in characters; no conversion | **Repaired**: ratio fixed by the plan (4 characters per token, low confidence), recorded in `prompt.built` |
| U3 | Underspecification | MEDIUM | row 60, plan, research D-13 | `carry.indexTitleChars` had no value | **Repaired**: 80, low confidence, X3 may change it (carried over from U2 of the first run) |
| U4 | Underspecification | LOW | F103-FR-026 | `keep`, `repair`, `unresolved` were in the closed set but not executed by the engine | **Repaired**: recorded in the layer's namespace, no counter changed |
| U5 | Underspecification | LOW | F103-FR-042, closed set | A layer-requested `fresh` had no reason in the closed set | **Repaired**: `layer-requested`; `fresh-session-reasons.json` updated |
| U6 | Underspecification | LOW | F103-FR-041 | "The prompt names the handoff" was not scoped to the block set `current` | **Repaired** |
| A1 | Ambiguity | LOW | F103-SC-004, plan | "the reference machine" undefined | **Repaired**: the Linux runner of the build workflow; the baseline measured again on it (T082) |
| A2 | Ambiguity | LOW | row 60 | `carry.contextFillShare` 50 without a unit | **Repaired**: per cent |
| D1 | Duplication | LOW | F103-FR-042 vs annex C | Two fallbacks of 300 s for the cache lifetime | **Repaired**: the descriptor's `cacheTtlSec` wins; `carry.ageFallbackSec` only where the descriptor declares none |
| K1 | Constitution | LOW | `plan.md` Constitution Check | Answered against v3.0.0 with a note to re-read Principle IX | **Repaired**: re-read against v3.0.1; the added sentence binds the features that start a critic; row IX stands |
| F1 | Ordering | LOW | T065 vs Dependencies | T065 (Phase 4) needed T074 and T075 (Phase 5) for the current set | **Repaired**: the current set is T069, after T074 and T075 |
| F2, F3 | Inconsistency | LOW | T010, T086, Phase 2 heading | Story tags and the phase heading did not match the stories | **Repaired** |

Constitution alignment: no issue; all twenty principles answered against v3.0.1. Count now: 44 functional requirements, 9 success criteria, 75 tasks (T058, T068, T069, T088 added); 21 parity test tasks and 27 characterization or conformance test ids (CT-103-108 to CT-103-145, one new); coverage 100 per cent.
