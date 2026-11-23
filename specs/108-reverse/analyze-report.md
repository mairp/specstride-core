# Specification Analysis Report: feature 108-reverse (after the split)

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, the constitution v3.0.0. This report replaces the one written before the split. Group G-B (F108-FR-035 to F108-FR-060, F108-SC-002, F108-SC-003, F108-SC-005) moved to `140-reverse-inventory-and-lint`. The analysis ran twice: on the first split and after repairs.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| S1 | Structure | LOW | `spec.md` "Requirements moved to 140-reverse-inventory-and-lint" | The id sequence has a gap (F108-FR-035 to 060; SC-002, 003, 005), explained by the table of old and new ids and tests | **Accepted** |
| S2 | Coverage | HIGH | B-1623 (plan exits 0 after printing the plan) | The item sat in the moved exit-code requirement | **Repaired**: it is in the `origin:` of F108-FR-015 with the test `PT-108-C-119-plan-exit` |
| S3 | Coverage | HIGH | Tasks of the lint, the inventory and the templates | They moved with G-B | **Repaired**: removed; Phase 2 now holds one task, the call of the inventory command; stories renumbered US1 to US4 |
| S4 | Inconsistency | MEDIUM | F108-FR-027, F108-FR-014 | The guard and the plan use the inventory document, whose format and walk rules moved; feature 100 holds no contract for the format | **Open; reported**: no citation of the sibling; the guard's text states the fields it reads |
| S5 | Terminology | LOW | `spec.md` overview, "Out of scope", "Closed sets" | The text names the sibling feature as owner of what moved | **Accepted**: pointers to an owner, not citations of a requirement |
| U1 | Underspecification | MEDIUM | F108-FR-009, F108-FR-010, F108-FR-012, F108-FR-014, F108-FR-015, F108-FR-019 | Readings that the sources do not settle: CQ-090 to CQ-093 | **Open by design** |
| F1 | Inconsistency | HIGH | Feature 100 annex B §B.5 and F100-FR-003, F100-FR-004, F100-FR-217 | CQ-092: the CLI writes two control-plane names of reverse at `plan` | **Open; reported** |
| F2 | Coverage | MEDIUM | Feature 100 annex B §B.5 | CQ-093: three logical names missing | **Open; reported** |
| F4 | Design | MEDIUM | F108-FR-021 | The driver lies in the workspace part; protection is detection through the source hashes | **Accepted; reported** |
| V1 | Ambiguity | LOW | F108-FR-009, F108-FR-030 | Facts that no run has shown: survival of a detached run; git on macOS | **Open by design**; each `unverified` with its check |
| K1 | Constitution | — | `plan.md` | Twenty principles answered | **No issue** |

No finding is CRITICAL.

## Additional checks

| Check | Result |
|---|---|
| Directory | `specs/108-reverse`, with the sibling `specs/140-reverse-inventory-and-lint` |
| Requirement ids | F108-FR-001 to F108-FR-034 and F108-SC-001, SC-004, SC-006, none twice, the gap explained; 34 requirements and 3 criteria |
| Every requirement has `test:` and a task | Yes |
| Own script over both parts | Every kept as-is id of the rows of `108-reverse` is in the `origin:` and the `proves:` of exactly one part: 158 items and 3 requirements or criteria here, 245 items and 1 requirement there; 0 in both, 0 in neither |
| `python3 docs/ecosystem/check-traceability.py` | Reports the moved origins as missing from `108-reverse`; expected until the orchestrator moves the rows |
| Citations between the parts | None of a requirement id; the two texts use the CLI commands and the logical names of feature 100 |
| The machine-specific backend | Not named |

## Coverage summary

- Functional requirements: 34, each with at least one task. Success criteria: 3, each with a test task. Tasks: 30.

## What did not pass

Nothing beyond the open readings CQ-090 to CQ-093 and the gaps of feature 100 (F1, F2, S4).

## After the cross-feature review

2026-09-30. The repair of act 8.6c: the one own item W-108-01 and the nine pointers W-100-04,
W-X-06, W-X-10, W-X-20, W-X-25, W-100-16, W-X-30, W-X-33 and W-X-34. No id was renumbered or
reused; no requirement was added; the count stands at 34 functional requirements and 3 success
criteria. Tasks go from 30 to 31 (T031 appended).

What changed, and the consistency pass over the places touched:

| Place | What changed | Consistency pass |
|---|---|---|
| F108-FR-009, "Clarifications" | Detached, a held lock ends with the handshake outcome of annex F §F.3 (`attached`, exit 4; `refused` with 24 for `lock-conflict` and `lock-unknown`), not `refused` (4) for every case | The requirement and the clarification say the same; feature 122's `spec.md:241` and `contracts/cli-state-commands.md:20-30` agree; annex F §F.3 is the authority |
| F108-FR-003, F108-FR-007, F108-FR-008, `data-model.md` | "engine start" for "engine invocation" | No "engine invocation" remains in the five artifacts (the term "engine start" is the one annex F §F.2 and annex B §B.7 give) |
| F108-FR-007, F108-FR-015, F108-FR-019, F108-FR-020, F108-FR-022, F108-FR-024 | The logical names `reverse:<slug>:claims:<unit-key>`, `:test-plan`, `:scaffolds`, `:output` cited as rows of annex B §B.5 | The four rows exist in annex B §B.5 (`B-state.md:238`, `:255` to `:257`); no name is called "proposed" or "missing" anywhere; the "Contracts of feature 100 used" table matches the requirement lines |
| "Rows of the `parity` profile" | The row of `loop.gitCommits` states "none; not a switch" in the column of §X.7 | The row agrees with F108-FR-008, which sets the switch at the rank of a flag |
| F108-SC-006 | The budget is cited as annex G §G.5 (F100-FR-187), not by the name of feature 113 | The "Out of scope" table keeps its owner pointers (S5); the task T027 measures the same figures |
| F108-FR-027 (earlier partial repair, checked) | The baseline is read through `specstride.reverse-inventory/1` (annex B §B.20, `B-state.md:676`); `divergence:` DV-116 exists in the register | The test CT-108-161 now has the task T031 |
| `tasks.md` T005 to T008, T010, T020, T021, T024, T031 | Every one of the 59 test names of the `test:` lines of the kept requirements is named in a task; T021's test name is written `PT-108-028FR026-guard-walk` as the spec says; T031 appended | Every requirement keeps at least one task; no task lost its `proves:`; the new task id continues the sequence |
| `contracts/*.schema.json` | `$id` added, `urn:specstride:schema:internal:108:reverse-plan/1` and `...reverse-verification-commands/1` | The two schema ids are in no annex of feature 100, so the internal form of `contracts/README.md` applies; no other feature reads them |
| `research.md` | The baseline is named without a machine path; the table of reported gaps states which are settled | The settled gaps agree with annex B §B.5, §B.20, rows 66 to 68 of §X.7 and F100-FR-003 as repaired |

Checks after the repair: `python3 docs/ecosystem/check-traceability.py --require-all` — PASSED
(checks a to h). No requirement without a task, no task without a requirement, no term or value
that differs between the files in the places touched.
