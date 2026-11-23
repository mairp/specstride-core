# Repair report of feature 145 after the cross-feature review

Written by the repair agent of act B-8.6c on 2026-09-30, from section 2 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` ("Items owned elsewhere that change files of feature 145").
All paths are relative to `specs/145-presenter/` unless they start with `specs/` or `docs/`.
Line numbers are those of the files after the repair. Every item was verified against the file
before it was changed; nothing was renumbered, and no requirement id or test name was reused.

## Item table

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-X-06 | repair | medium | done | `spec.md:84` (edge cases); `spec.md:151` (F145-FR-006) | "Retargeted to a new run" is "retargeted to the file of a new engine start" (ruling 24). The as-is literals `────── new run ──────` and `── new run detected — following it ──` stay (W-X-36). F145-FR-011 `:178` already spoke of a link and a replaced file, no run wording |
| W-X-09 | repair | medium | done | `plan.md` (Constitution Check, row XVII); `tasks.md` (T025, Phase 6) | Row XVII is answered as a pass with its reason: the feature has parity tests on a pseudo-terminal (FX-40) and T025 records the macOS result and every skip with its reason; F145-FR-013 stays `unverified` until then. The task follows the model of `specs/143-parallel-engine-services/tasks.md` T070 |
| W-X-11 | repair | medium | done | `spec.md:110` (F145-FR-002 `parity:`); `contracts/presenter.md:11` | "(row proposed …)" is "(row 71 of annex X §X.7)"; the row number was checked against `specs/100-specstride/annexes/X-cross-layer.md:536`. The contract's "aliases of proposed keys" now names rows 70, 71 and 73 to 78 of §X.7 with the status confirmed. The feature has no `parity-rows.json` or `config-keys` file |
| W-X-14 | repair | medium | done | `plan.md:31` to `:79` | The Constitution Check is one line per principle I to XX, the constitution v3.0.0 is named, each of the eleven N/A answers carries a reason that bears on its principle, and each pass names the requirement behind it. No violation; Complexity Tracking stays empty |
| W-X-20 | repair | medium | done | `tasks.md:48` to `:72` (T004 to T008), `:94` to `:102` (T016 to T018) | The test names of `spec.md` and `tasks.md` are equal: the 24 `test:` names of the spec (the wildcards `PT-145-C-nnn-*` and `CT-145-1`, `CT-145-2`) all stand in task headlines now; one task holds the several names of one file. No test of this feature had no task at all. The retired concrete names (`PT-145-C-096-presenter-options` and five others) were cited nowhere else |
| W-123-04 | repair | low | done | `spec.md:183` (F145-FR-012) | `NO_COLOR` and `FORCE_COLOR` are read as at the baseline, with the behaviour items B-1411 and B-1412, in the order the settled table gives: after the caller's `--color`, `NO_COLOR` before `FORCE_COLOR`. The four platform variables `NO_COLOR`, `FORCE_COLOR`, `TERM`, `COLORTERM` are named to the alias table of feature 110 (`specs/110-config-and-terms/contracts/alias-table.tsv:105` to `:108`), where they map to no key. The behaviour was already the baseline's; only the statement and the citation were missing |
| W-X-34 | accept | low | not applied (no change asked) | — | The analyze report keeps the old ids as a record; nothing to change |
| W-X-36 | accept | low | not applied (no change asked) | — | The as-is literal `────── new run ──────` keeps the retired word |

Counts: 6 done, 2 not applied (both `accept`, no change asked), 0 open.

## Requirements added or changed in place

| Requirement | Change | Source item |
|---|---|---|
| F145-FR-002 | `parity:` names row 71 of annex X §X.7 in place of "row proposed" | W-X-11 |
| F145-FR-006 | "retargeted to a new run" is "retargeted to the file of a new engine start" | W-X-06 |
| F145-FR-012 | `NO_COLOR` and `FORCE_COLOR` are read as at the baseline, with B-1411 and B-1412; the four platform variables are named to the alias table of feature 110 | W-123-04 |

No requirement was added; the count stays 22 functional requirements and 3 success criteria.
One task was added (T025), and the headline test names of T004 to T008 and T016 to T018 were
replaced by the wildcard names of the spec; no task id was renumbered and no test name reused.

## What another feature or the orchestrator must do

| # | What | Who |
|---|---|---|
| 1 | Keep the clarify-queue rows CQ-100 and CQ-101 open for the owner. This spec proceeds on the recommended answers (`assumption: CQ-100` on F145-FR-009, `assumption: CQ-101` on F145-FR-022) | The queue owner |
| 2 | When CQ-100 or CQ-101 is answered otherwise, F145-FR-009 and F145-FR-022 change, and the register may need a row | 145, with the answerer |
| 3 | No change is asked of feature 100, of feature 119 or of feature 110 by this repair. The alias table of feature 110 (`:105` to `:108`) already states the settled reading of the platform variables and is cited, not changed | — |

## New questions

None. The two questions of this feature (CQ-100, CQ-101) already stand in the queue with
recommended answers; this repair raises no new one and needs no register row (`divergence:` fields
name DV-006, DV-007, DV-027 and DV-066, all of which exist).

## Register rows needed

None.

## Checks

| Check | Result |
|---|---|
| A generator of this feature in `contracts/tools/` | None exists; nothing to run |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED, checks a to h; 41 of 41 Wave 1 features have a spec |
| Consistency pass over `spec.md`, `plan.md`, `tasks.md`, `contracts/presenter.md` | 25 requirements (22 FR, 3 SC), each in a `proves:` or `covers:` of exactly one task; 25 tasks, unique ids; all 24 `test:` names of the spec stand in task headlines; wording and row numbers read the same in every file touched |

One pre-existing fault was found and fixed while repairing: `spec.md` repeated the sentence "The
presenter, the banner and the theme are not public commands …" twice at the head of the
requirements section. The duplicate was removed; it changed no requirement.
