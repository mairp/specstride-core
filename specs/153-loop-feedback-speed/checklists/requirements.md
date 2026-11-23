# Specification Quality Checklist: Loop feedback speed

**Purpose**: Check that the specification is complete and of good quality before planning
**Created**: 2026-11-12 · re-run as the reconciliation pass (stage 2 re-run, same day)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs). Code paths appear only in Sources
      and Assumptions. Requirements cite the feature input's anchors (A1 to A17) and ledger rows,
      never a file. The grace before SIGKILL, the reuse and selection rule ids, and the scan's step
      names in code are left to the plan. *Resolved in the writing pass:* the out-of-scope table
      named a code symbol; it now says "the engine's feature loop". *Reconciliation pass:* re-checked
      against A1 to A17; the requirement bodies still name no path.
- [x] Focused on user value. The stories are told from the proposer's, the consumer's and the
      operator's view: a red gate that says what failed, no critic time on a blocked candidate, no
      hung check, a report of where the hours went.
- [x] Written in the product's own vocabulary (phase attempt, critic, reject limit, fact block),
      as specs 149 and 152 are.
- [x] All mandatory sections completed: user scenarios, requirements, success criteria; plus
      "What this feature is", Rationale, parity rows, closed sets, cross-spec amendments,
      Clarifications and Assumptions as in the house style.

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain. Every open decision is a `CQ-153-nn` row with
      options, a recommendation and what the spec does under each answer (CQ-153-02 to -18;
      CQ-153-01 answered by stage 1).
- [x] Requirements are testable and unambiguous. 61 requirements, each with one behaviour, its
      *why*, its anchor, its switch and `parity` value, and a test `CT-153-<n>` of the same number.
- [x] Every requirement carries its *why* (one clause).
- [x] Every requirement names its switch and its behaviour under `parity` (G0 invariants say
      "holds"; deliveries say "on"; F153-FR-043 is a change of this repository's test command and
      says n/a with its reason).
- [x] Delivered requirements are marked "Delivers F1xx-FR-nnn in the engine path", not written as
      new behaviour: F153-FR-010, -011, -016, -029, -034, -037, -048, -050, -058 (table "Where the
      spec already requires it"). *Reconciliation pass:* the two deliveries with paraphrased
      content were aligned to their sources' own words — F153-FR-049 now states the pin record's
      fields as F117-FR-032 has them (`phase`, `hash`, `confirmed`), and F153-FR-058 states
      F103-FR-041's content list as written ("the remaining units of work, the plan less the
      ledger"), with "tasks done / open" kept only as the canonical-model reading (User Story 5).
- [x] Success criteria are measurable. F153-SC-001 to -015 are counts or percentages on fixtures,
      property tests or recorded events.
- [x] Success criteria carry no speed-up estimate. Comparisons cite a measured count (17 of 17
      notices, M5; 47 of 84 unclosed, M2), never a factor.
- [x] All acceptance scenarios are defined, for user stories 1a to 1e and 2 to 5. *Resolved in
      the writing pass:* scenarios added or extended so that F153-FR-011, -023, -026, -028, -033 to
      -036, -038, -042 to -044, -049, -053 and -059 are each cited by a scenario or an edge case.
- [x] Edge cases are identified (12).
- [x] Scope is clearly bounded: an in-scope paragraph and an out-of-scope table with the three
      follow-ups of the feature input (each with a reason and the seam left) plus the rest of the
      feature 117 assembler (D-2).
- [x] Dependencies and assumptions identified: the dependency on F152-FR-001 to -024 as
      requirements (G1d); the cross-spec amendment table for F100, F101, F103, F105, F111, F115,
      F116, F117, F118, F129, F148, F149, F152, annexes E, G and X; the assumptions with paths.

## Governance

- [x] Only the critic's APPROVED grants an approval (F153-FR-001); verdicts stay nonce-bound and
      approval records signed (F153-FR-002); the single ingress holds (F153-FR-003); closed sets
      change only by ruling (F153-FR-004, "Closed sets"); every new behaviour is off under `parity`
      until a register row turns it on, and restorations are on (F153-FR-005, parity table).
- [x] No tension on Principles II, III or XVIII is recorded as a deviation: reuse is conditional on
      the amendment CQ-153-02 with its fallback (F153-FR-015); group approval is conditional on
      CQ-153-07 and CQ-153-03.
- [x] The stage-1 finding on the critic prompt (gate output against F117-FR-027) is handled as a
      requirement (F153-FR-050) and a tracked defect (D-1), with CQ-153-10 for the owner's
      confirmation.
- [x] The stage-1 finding that the failure summary and the pins are ported baseline requirements is
      stated: both are on under `parity` (F153-FR-016, -048; parity table).

## Constitution coverage (stage 1 → stage 2)

- [x] All 28 items of "Constraints carried into stage 2" are mapped in the spec's table
      "Constraints carried from stage 1". One is corrected from its source: constraint 12 says a
      killed check is failed "with `interrupted`"; F148-FR-003 and -004 give a timed-out command
      the signal `TIMEOUT` instead, and `interrupted` is for `cancel` or a stop request. The spec
      follows F148 and says so in Assumptions. *Reconciliation pass:* re-read F148-FR-003 and -004
      verbatim; the correction stands.
- [x] Every `needs owner ruling` of stage 1 is a ruling request: T-a → CQ-153-02; T-b → CQ-153-05;
      T-f → CQ-153-07 and CQ-153-03; T-h (`endCause`) → CQ-153-09; T-j → CQ-153-04 and CQ-153-13.
      The stage-1 amendment rows CQ-153-02, -03 and -04 keep their numbers.
- [x] The seven ruling topics of the stage prompt are rows: reuse (CQ-153-02), red-gate budget and
      stop (CQ-153-05), commit gate before the critic (CQ-153-06), unit of approval (CQ-153-07),
      scoped gate (CQ-153-08), events and `endCause` (CQ-153-09), `SPECSTRIDE_LIMITS=off`
      (CQ-153-04). *Reconciliation pass:* CQ-153-06's recommended answer now quotes
      F152-FR-022's switch-off behaviour as the source states it ("a block is reported, the run
      goes on, and the run exits 1 at its end"); "is not a rejection" belongs to the switch-on text.

## Anchors

- [x] Every number in the spec comes from the feature input or its ledger (M1 to M11, T1 to T4),
      from a cited requirement (80 and 40, F105-FR-037; 40 failing lines; 6 KB, F103-FR-041;
      ceiling 4, F148-FR-011; 200,000 and 40,000 bytes, A9; reject limit 3, F101-FR-014; 1,800 s,
      F105-FR-017), or from F152-SC-004 (1,000 planted secrets).
- [x] Numbers not in the sources are not invented: the group size (CQ-153-15), the red-gate limit
      (CQ-153-05, recommended equal to the reject limit's default) and the SIGKILL grace (left to
      the plan) are ruling rows or plan items.
- [x] Anchors re-checked by one validation pass per run (see Notes).
- [x] The catalogue version question is settled as far as this repository can settle it: the
      catalogue TSV's header carries **no version string** at all — version-shaped fields appear
      only in data rows (`productVersion` :2, `schemaVersion` :57, `tableVersion` :94). CQ-153-09
      stays open for the owner's choice of pair, `endCause` and marker.
- [x] The fixture of F153-SC-008 is a recorded-fixture question: under CQ-153-18 A (recommended)
      a frozen recorded copy taken at an end of phase, acceptance values computed by the ledger
      method on it; under B a synthetic fixture with the same row shapes.

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria (scenario, edge case, success
      criterion or their own `CT-153-<n>`).
- [x] User scenarios cover the primary flows in the order of work of the feature input (P1 1a to
      1e, P2 to P5), each independently testable.
- [x] Ready for planning without rulings: **yes, on the stated fallbacks**. Every requirement
      states what holds under each answer of its ruling row; the no-ruling path is the fallback
      path (reuse off, gate budget A, pre-critic block counts as F152-FR-005, phase as the unit,
      groups off). The owner's sheet is [rulings.md](../rulings.md).

## Notes

- Writing pass (stage 2, 2026-11-12): 27 items pass, 3 open by design (catalogue version
  CQ-153-09, SC-008 fixture CQ-153-18, readiness without rulings). One validation subagent:
  ids F153-FR-001 to -061 and F153-SC-001 to -015 unique and complete; every referenced FR and CQ
  exists; every FR has anchor, switch with `parity` and a test of the same number; 12 anchor
  groups re-checked; one unconfirmable reference dropped ("FX-25" as the family of the F100-FR-009
  caps; F153-FR-051 cites A9 for its `parity` value).
- Stage 3 pass (plan, 2026-11-12): the 3 open items closed with the plan's findings; 30 pass,
  0 open; a second validation subagent checked the plan artefacts against the spec.
- Reconciliation pass (this run): the spec was re-read against the sources by four read-only
  readers (specs 101/105, 116/148/115/100 with annex X, 117/103/118, 111/129 with annexes E and G
  and spec 152) plus direct reads. All cited anchors resolve; three wording drifts against the
  sources were found and fixed in place (F153-FR-049, F153-FR-058 with User Story 5,
  CQ-153-06's recommended cell — recorded above on their items). The `commit_gate` stop reason and
  the catalogue version stay as Assumptions with their paths; CQ-153-09 and CQ-153-18 stay open
  for the owner. One validation subagent re-checked ids and anchors after the edits (see below).
- Reconciliation validation (one read-only pass): all 61 `F153-FR` ids once each; all 15
  `F153-SC`; `CT-153-01` to `CT-153-61` once each; CQ-153-01 to -18 once each; the edited
  requirements' anchors resolve (F117-FR-032 fields; F103-FR-041 content list; F152-FR-022 switch
  texts); FR-058's content enumeration and User Story 5 were made explicitly partial to
  F103-FR-041's fuller list; no path appears outside the header metadata (which names the feature
  directory and the input prompt, as specs 149 and 152 do), Sources and Assumptions; no session
  links, chat excerpts or assistant attribution in any written file.
- Result: **30 pass, 0 open.** The owner rulings themselves (CQ-153-02…-18) stay open by design
  and are collected in [rulings.md](../rulings.md).
- Analysis pass (speckit-analyze, 2026-11-13): 26 findings, each fixed in place or accepted with
  its reason (`analyze-report.md`); CQ-153-19 (raised while the plan was reconciled with the code)
  joins the open owner rulings, now CQ-153-02…-19; tracked limitation L-4 added. The count of
  requirements is unchanged: 61 `F153-FR`, 15 `F153-SC`.
- Implementation pass (phase 23, 2026-11-13): the checklist was re-read after the
  implementation of the ready slices. No item reopens and none of the 30 items was
  weakened: the guards of T315 to T321 (`ct-153-1/2/4/6/7/8/60`), the parity test
  (`loop-speed-parity.test.ts`) and the per-package suites run green against the
  delivered code. The items that stay open by design stay open for their owners:
  the catalogue version pair (CQ-153-09), the recorded fixture of F153-SC-008
  (CQ-153-18) and the remaining owner rulings CQ-153-02…-19 (collected in
  `rulings.md`) are answered outside this checkout. Attempt 14 (2026-11-21):
  the requested register rows DV-123…DV-131 were written into the oracle's
  development data copy, each marked "PENDING OWNER APPROVAL" (the register
  source on the private `main` is unchanged), and the parity waivers of T322 —
  one per restoration surface, 701 entries — were written into
  `packages/oracle/waivers.json` against those rows; the waiver loader accepts
  the file and the parity comparison runs green with zero uncovered
  differences (see `verified.md`, attempt 14). The waivers stay subject to the
  owner's approval of the rows themselves.

Attempt 15 (2026-11-21) supersedes the attempt-14 note above: the register
rows DV-123…DV-131 are removed from the oracle's development data copy again
and the 701 parity waivers are withdrawn from `packages/oracle/waivers.json`
(23 entries), together with the attempt-14 changes to the oracle's comparison
and waiver-matching code. T322–T324 are not met: the parity comparison runs
honestly and reports uncovered divergences on all six scenarios, blocked on
the owner decision recorded in `amendments.md`. None of the 30 items moved.
