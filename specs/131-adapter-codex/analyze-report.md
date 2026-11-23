# Analyze report: feature 131-adapter-codex

Date 2026-09-29. Artifacts: spec.md (39 requirements, 8 success criteria), plan.md, research.md, data-model.md, contracts/, quickstart.md, tasks.md (61 tasks). Runs: 1 (no repair needed after the checks below).

## Coverage

| Check | Result |
|---|---|
| Every requirement has a test task (`proves:`) | 39 of 39 |
| Every kept item (8) and cluster (4) is the `origin:` of a requirement and named by a `proves:` | Yes |
| Every success criterion is measured by a task | SC-001 T035, SC-002 T036, SC-003 T039, SC-004 and SC-006 T061, SC-005 T015, SC-007 T013, SC-008 T057 |
| Captures are the first tasks | T001 to T005 |
| Paid probes are tasks that say so and are not run | T044, T050, T060 |
| Constitution Check: 20 principles answered | Yes, no violation |
| `[NEEDS CLARIFICATION]` markers | 0 |
| Machine-specific names | 0 |
| `python3 docs/ecosystem/check-traceability.py`, lines for this feature | One `[h2]` line: F131-FR-030 cites `DV-106`, a register row to be written (expected, reported) |

## Findings

| # | Finding | Severity | State |
|---|---|---|---|
| 1 | Feature 100 annex C §C.1 says "the minted session id"; Codex accepts no chosen id | Medium | Proceeded on the narrowest reading (CQ-117) |
| 2 | FX-07 lists `codex-missing-key` as a critic configuration error; the baseline scores it as a failed call | Medium | Proceeded on the code (CQ-116) |
| 3 | The alias table of annex X §X.8 lacks `OPENAI_BASE_URL` and `OPENAI_API_KEY` | Low | Reported |
| 4 | C2 in annex C §C.15 says credential paths denied; read denial of Codex is unverified | Medium | Stated as null until capture 3 |
| 5 | Register row for the parity-only fallback window is missing | Low | `DV-106` |

## Split

39 requirements, below the mark of about 45. No split proposed.

## After the cross-feature review

Date 2026-09-30. Source: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section of feature 131 (2 own items, 9 pointers), and the points of the orchestrator. Details per item: `repair-report.md`. Findings 2, 3 and 5 of the table above are closed: CQ-116 was answered in the catalogue of feature 141 and the open question is CQ-187; both `OPENAI_*` variables are in annex X §X.8; register row DV-106 exists.

### What changed

| Subject | Change | Files |
|---|---|---|
| Paid captures (W-131-01, W-X-15) | Captures 1, 2, 4 and 5 are marked paid, capture 3 not paid; F131-FR-038 reads "no other paid call than the three probes and the captures marked paid"; no test and no task waits for a capture or a probe; a test without its fixture is a skip | spec.md, plan.md, tasks.md, data-model.md, quickstart.md, research.md, contracts/captures.json |
| Containment C0 (W-110-05) | The opt-in comes from user configuration only (CQ-183) | spec.md, plan.md, tasks.md (T027), research.md, data-model.md |
| Critic diversity (W-X-17) | New requirement F131-FR-040, test CT-131-40, tasks T062 and T063; F131-FR-021 names the rule | spec.md, plan.md, tasks.md, data-model.md, quickstart.md |
| Principles VIII and IX | Rows VIII and IX of the Constitution Check are deviations; six rows in Complexity Tracking (CQ-143, CQ-145, CQ-117, CQ-187; DV-030, DV-031, DV-047, DV-106, DV-117) | plan.md, spec.md (F131-FR-013, F131-FR-029), research.md |
| Parity prompt (W-131-02) | The plan says that under `parity` the prompt travels as one positional argument without a bound | plan.md (row VIII, row XVIII, argument table, Complexity Tracking), contracts/parity-rows.json, research.md |
| Opt-in keys (W-110-09) | `memory.native.proposer`, `harnesses.codex.proposerCustomisations`; row 131 of the profile | spec.md, plan.md, tasks.md (T032), data-model.md, contracts/parity-rows.json |
| `retryable` (W-127-02) | A value for each of the nine classes; `provider_other` true | spec.md (F131-FR-033), plan.md, tasks.md (T052), data-model.md, contracts/classifier-entries.json |
| Missing key (CQ-187) | F131-FR-027 follows the code under `parity`; DV-117 cited; the note on CQ-116 removed | spec.md, tasks.md (T046), quickstart.md, checklists/requirements.md |
| Smaller items | W-110-03 (alias table), W-X-05 (register without a count), W-X-16 (terms gate is 147), W-X-19 (`implements (an entry)`), row 30 key | spec.md, plan.md |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirements and tasks | 40 functional requirements, 8 success criteria, 63 tasks |
| Every requirement has a test task with `proves:` | 40 of 40; F131-FR-040 by T062 |
| Every test name of `spec.md` is in `tasks.md` | Yes; CT-131-40 added in both |
| Task without a requirement | None; T062 proves and T063 covers F131-FR-040 |
| Tasks that call a model | T001, T002, T004, T005, T044, T050, T060: all say PAID; T003 says not paid. The same marks in contracts/captures.json, data-model.md and the table of tasks.md |
| A paid task as precondition | None. "T043 needs T003" and "T001 to T005 before T006" are removed from Dependencies |
| Opt-in to C0 | "user configuration only" in F131-FR-010, F131-FR-011, the table of settings, plan row VIII, T027, research decision 2 |
| Key of the customisations | `harnesses.codex.proposerCustomisations` in spec, plan, tasks, data-model and parity-rows.json, one spelling |
| `retryable` | The same nine values in F131-FR-033, plan.md, data-model.md and classifier-entries.json; F131-FR-032 (`quota_window` true) agrees |
| Missing key | One expectation in F131-FR-027, User Story 3 scenario 2, T046 and quickstart step 5 |
| Rows of the profile | 10 rows in the spec table, in parity-rows.json and in plan.md |
| Constitution Check | VIII and IX are not marked as passed; each deviation has a row in Complexity Tracking with its question or register row |
| `CQ-pending-*`, `DV-new-*`, "same-model warning" | 0 uses |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED, checks a to h; feature 131: 8 of 8 |

### What remains

| # | What | State |
|---|---|---|
| 1 | The key `harnesses.<id>.proposerCustomisations` is not in the key list of feature 110 | Reported |
| 2 | §Q.1 of feature 127 has no column `retryable` yet; the values here are those of annex E §E.3 and of item W-127-02 | Reported |
| 3 | CQ-117, CQ-143, CQ-145, CQ-183, CQ-187 are open | The specification proceeds on the recommended answers |

### Split

40 requirements, below the mark of 45. No split proposed.
