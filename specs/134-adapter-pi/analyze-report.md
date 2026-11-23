# Analyze report: feature 134-adapter-pi

Date: 2026-09-29. Read-only analysis across `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md` and `contracts/`. Two passes were made; the first found four points, all repaired, the second found none.

## Coverage

| Check | Result |
|---|---|
| Functional requirements | 29 (`F134-FR-001` to `F134-FR-029`), ids unique, no gap. Estimate in the brief: 22 |
| Success criteria | 7 (`F134-SC-001` to `F134-SC-007`), each with a test. The four of the brief are SC-001 to SC-004 |
| Requirements with a test task in `tasks.md` | 29 of 29 |
| Success criteria with a test task | 7 of 7 |
| User stories with tasks | 5 of 5 (US1 to US5) |
| `[NEEDS CLARIFICATION]` markers | 0 |
| References to an id that does not exist | 0 |
| As-is ids assigned to this feature | 0 (no row in `traceability-frs.tsv` or `traceability-items.tsv`); `python3 docs/ecosystem/check-traceability.py` prints no `[h` line that names this feature |
| Captures as first tasks | T001 to T006, before any implementation task. The paid ones are marked and not run |
| Machine-specific names, closed list of harnesses | None found by text search |
| Split | Not needed: 29 requirements, below about 45 |

## Constitution

All twenty gates of the plan are answered. Principle VIII's "contained by default" is met by the refusal without the C0 opt-in (F134-FR-008), which is the stated consequence of a harness with no sandbox.

## Findings and repairs

| # | Finding | Repair |
|---|---|---|
| 1 | Three cross-references in the user stories pointed at the wrong requirement (context window, unknown terms, invocation) | Corrected in `spec.md` |
| 2 | The brief binds Principle VIII to the proposer (auto-loaded context and native memory off by default), but no requirement stated it | Added F134-FR-029 and its row in the profile table |
| 3 | CAP-4 needed a second paid call, against "one logged probe per role; no other paid call" | CAP-4 rides on the proposer probe of CAP-2; continuation of a second pass is proven on the fake executable and stays `unverified` live |
| 4 | The spec named flags of pi | Moved to `plan.md` and `contracts/descriptor.pi.json`; the spec keeps behaviour only |

## Remaining

Nothing failed. Points that stay open and are marked in the spec:

| Id | Point |
|---|---|
| CQ-108 | The ids of the five doctor checks are proposals for feature 112 |
| CQ-109 | Reading of "fresh pass runs without a session" against "session minted per phase attempt" |
| CQ-110 | How the minted identity is compared when the critic keeps no session |
| Provisional facts | Every pi fact is `unverified` until the captures of Phase 1 are logged; the pin is provisional |

## After the cross-feature review

Dated 2026-09-30. The repair of the worklist of 2026-09-30 (items W-134-01 and the pointers) was
applied; see `repair-report.md` for the item table. What changed, and the consistency pass over
the touched places:

- Requirements: 30 (`F134-FR-001` to `F134-FR-030`; FR-030 added by W-X-17), success criteria 7. FR-030 has the test CT-134-30 and the task T039 with `proves:`; `contracts/traceability.json` holds it. No requirement was renumbered.
- Every requirement touched by the repair still has its test and test task; F134-FR-008, -009 and -029 were changed in place only (source of an option, a key name, wording), so their tests needed no change.
- Terms checked for drift after the repair: "provider" replaces "back end" in spec, plan, tasks, data-model, research and contracts (the quoted input line of `spec.md` and the literal "loopback endpoint" keep the old text); the terms gate and the terms file are feature 147's, the secret resolvers stay feature 110's; the logical name `package:harness:<id>` is cited from annex B §B.5 in spec and plan; the test directories are `tests/characterization/134/` (and the unused `tests/parity/134/`) in plan and tasks; the package is `@specstride/adapter-pi` and the reader is imported from `@specstride/adapter-prime` in plan and tasks; the register count is 117 (DV-001 to DV-117) in the clarification of `spec.md`.
- One value settled by feature 127: `retryable: true` on the default row of `contracts/classifier-entries.pi.json`; the six named entries already carried the §Q.1 values of their classes.
- `python3 docs/ecosystem/check-traceability.py --require-all` passes (checks a to h).
