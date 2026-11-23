# Repair Report: feature 147-terms-gate

Act B-8.6c, 2026-09-30. The feature has no item of its own; seven pointer items of the worklist and
one standing change of feature 134 were applied. Every item was verified against the files before it
was applied; the places named in the worklist were checked first (line numbers had not moved in ways
that change any place).

## Items

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-111-02 | repair | high | done | `spec.md` (F147-FR-005, F147-FR-009) | Verified: the catalogue of feature 111 holds both types (`F111-FR-051`; `contracts/event-catalogue.tsv:123`; the table "Types added on 2026-09-30" names `fallback.skipped` with the reason `terms-refused` of the set of 127, and `terms.override_used` with provider, auth tier, audience). F147-FR-005 now names `fallback.skipped` (reason `terms-refused`), F147-FR-009 names `terms.override_used` in place of "a recorded event". The types are named as types of the catalogue of feature 111, as F127-FR-020 does |
| W-X-01 | repair | high | done | `plan.md` (Primary Dependencies, Project Type, Project Structure, Structure Decision); `tasks.md` (T001 to T008 paths) | Verified: the package graph of feature 100 holds `@specstride/policy` (owners 110, 127, 147) and holds no package `terms`. All paths renamed to `packages/policy/src/terms/` and `packages/policy/tests/unit/`. The dependency line now states that role resolution and the doctor receive `evaluate` from the composition root through the interface of EP-11 in `@specstride/contracts`, as plan 124 says, and that `@specstride/harness` and `@specstride/doctor` import neither `@specstride/config` nor `@specstride/policy` (rule LR-1). One extra correction in the same spirit: the conformance test of T004 moved to `packages/testkit/src/conformance/EP-11/`, the place feature 100 fixes (repair report of 100, row 35) |
| W-134-01 | repair | medium | done | `spec.md` (edge case, F147-FR-007, F147-FR-011); `plan.md` (row VII); `research.md` (decision 3) | Verified: three places in the spec as named, plus the repeats in plan row VII and research decision 3. "Provider" written everywhere; the one remaining literal "back end" in `spec.md` is the citation of this item in "Repairs after the cross-feature review" |
| W-X-09 | repair | medium | done | `plan.md` (row XVII of the Constitution Check); `tasks.md` (new T011) | Verified: no task recorded the macOS result or a skip. T011 added (unpaid, no model call, never a precondition of another test). Row XVII answered as a pass whose reason is about tests: every `unverified` fact names its check (F147-FR-011, T006), a test whose prerequisite is missing is a skip with its reason, the macOS result is recorded (T011) |
| W-X-14 | repair | medium | done | `plan.md` (Constitution Check, new Complexity Tracking) | Verified against the plan template as feature 100 uses it: the gate line, constitution v3.0.0 named, every row answered with ✅ and the requirement cited behind it, the rows IV, XIV, XVI and XX now give reasons that bear on their principles (not N/A), XVIII and XIX restored (they were missing), "Re-check after Phase 1 design" line added, section `## Complexity Tracking` added (empty: no deviation, no stated reading) |
| W-X-18 | repair | medium | done | `spec.md` (F147-FR-007, row EP-02 of "Extension points") | Verified: the EP-02 row said `consumes` and no requirement carried the `ep:` line. `ep: EP-02 specstride.harness/1 (consumes)` added to F147-FR-007, the requirement that reads the provider and the terms reference of the descriptor; the row names the requirement |
| W-X-27 | repair | medium | done | `plan.md` (Primary Dependencies); `research.md` (last paragraph) | Verified: plan.md named "a schema validator chosen at implementation". Now: the JSON Schema validator that feature 100 chose (Ajv, draft 2020-12, pure JavaScript, MIT, `specs/100-specstride/research.md` D-2). No YAML parser is named, because the terms data is JSON; the research records that a file that reads YAML would go through the loader of feature 110, whose one parser is the npm package `yaml` (feature 100, D-8) |
| 134 handover (W-X-16 of feature 134, 2026-09-30) | — | — | done | `spec.md` (F147-FR-011); `tasks.md` (T005); `contracts/README.md` | The terms facts of pi (R8v rows 37 to 40, `terms-facts.json` written by T025 of feature 134) are referenced where this feature holds them: F147-FR-011 states that pi has no row of its own and that the row of the provider in use applies with those facts; T005 carries `terms-facts.json` into the generated data; `contracts/README.md` records the handover. The spec already covered the behaviour: F147-FR-007 (pi gated by the provider row; the OAuth subscription login is Tier 3 and refused) matches F134-FR-005 and F134-FR-006 of feature 134, and the facts agree with `docs/ecosystem/research/R8v-terms-verification.md` rows 37 to 40 |

Not applied: none. Open: none.

## Requirements added or changed in place

No id added, renumbered or reused. Changed in place (see `spec.md`, "Repairs after the cross-feature
review"):

| Requirement | Item | Change |
|---|---|---|
| F147-FR-005 | W-111-02 | Names `fallback.skipped` (reason `terms-refused`) for an entry the gate refuses |
| F147-FR-007 | W-134-01, W-X-18 | "provider" for "back end"; `ep: EP-02 specstride.harness/1 (consumes)` added |
| F147-FR-009 | W-111-02 | Names `terms.override_used` in place of "a recorded event" |
| F147-FR-011 | W-134-01; 134 handover | "provider"; pi stated as no row of its own, with the facts of R8v rows 37 to 40 |

No new requirement, so no new test and no new test task is needed; the existing tests CT-147-105,
CT-147-107, CT-147-109 and CT-147-111 prove the changed text (T002, T003, T005).

## What another feature or the orchestrator must do

- Feature 111: nothing new; the two types this feature names exist (`F111-FR-051`).
- Feature 134: write `terms-facts.json` (its task T025) before T005 of this feature runs; T005 of this
  feature depends on it.
- Feature 110: nothing; the keys `distribution.termsOverride` and `roles.<role>.tier` are in its
  catalogue with this feature as reader.
- Orchestrator: none of the "Assumptions" gaps remains to be sent: the report of a missing contract
  for `distribution.termsOverride` and `roles.<role>.tier` (analyze report F1) is withdrawn — the keys
  are `confirmed` in the catalogue of feature 110 (`contracts/config-keys.tsv` rows 5 and 11) and
  annex X §X.2 names `distribution.termsOverride`. T010 of this feature now sends only the standing
  documentation facts (provider pages, `unverified`, check T006).

## New questions

None. No `CQ-pending-*` placeholder exists in this feature, and no repair raised a question the
sources cannot answer.

## Register rows needed

None. DV-003 and DV-048, cited before the repair, are enough.

## Checks

- No generator of this feature exists in `contracts/tools/`; nothing to run.
- `python3 docs/ecosystem/check-traceability.py --require-all`: **PASSED** (checks a to h; 41 of 41
  Wave 1 features have a spec). It fails on no feature.
- Consistency pass over spec, plan and tasks after the edits: every requirement F147-FR-001 to
  F147-FR-014 keeps a test task with `proves:` and an implementation task with `covers:`; the terms
  `provider` and the package `@specstride/policy` are spelled the same in spec, plan, tasks,
  research and contracts; no `packages/terms` path and no "back end" remains outside the citation of
  item W-134-01. Size: 14 functional requirements, 3 success criteria, 11 tasks — under 45, no split.
