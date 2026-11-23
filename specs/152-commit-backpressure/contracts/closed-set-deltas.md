# Closed-set deltas: 152-commit-backpressure

Approved: every ruling named below was answered A by the owner on 2026-11-09. The final row texts
are in [../amendments.md](../amendments.md), sections 3 to 5. `specs/100-specstride/contracts/` is not
edited by this feature; each delta is entered by the owner of the set.

| Set (annex X §X.6 row) | Owner | Delta | Ruling | Files the owner edits |
|---|---|---|---|---|
| Blocked reasons (row 4, annex E §E.2) | 100 | + `commit-gate`. When: "two consecutive blocked approval commits of one phase with the same signature (F152-FR-006), or a voided approval whose task list a human changed beyond its ticks". Stop reason `max_rejects`, engine exit 2, `retryable` No | CQ-152-01 A | annex E §E.2; `specs/100-specstride/contracts/data/` (the machine table); `packages/contracts/src/state/blocked-reasons.ts` |
| Effects of a commit-gate rule (row 286, new) | 152 | `block`, `exempt`. Closed by Design. Unknown value → refusal at load | — | annex X §X.6 |
| Outcomes of a phase attempt (engine-internal, `ATTEMPT_OUTCOMES`) | 101 | + `commit-blocked` | — (design, F101 amendment row) | `packages/core/src/engine/phase.ts` |
| Kinds of a rejection (engine-internal, `KINDS_OF_A_REJECTION`) | 101 | + `commit-blocked` | — | `packages/core/src/gate/limits.ts` |
| What failed in an approval record (row 255) | 101 | + `voided`. The integrity note keeps its kind `approval-invalid` and carries `failed: "voided"`, so the integrity kinds do not change | — (design) | annex X §X.6 row 255; `packages/contracts/src/enums/gate.ts` (`APPROVAL_FAILURES`) |
| Ledger counters of `core` (`CORE_COUNTERS`) | 100 | **none**: the block facts are read from the block records (research D9) | — | — |
| Stop reasons (row 3, §E.3) | 100 | **none** under CQ-152-01 A. Under B: + `commit_gate_blocked`, `transient` No, plus an exit code | CQ-152-01 | — |
| Kinds of phase attempt (row 9, §E.1) | 149 | **none** under CQ-152-02 A. Under B: + `commit-retry` | CQ-152-02 | — |
| `parity` profile (§X.7) | 152 | + row 134 `commit.backpressure`: default on, `parity` off, DV-121 | CQ-152-04 | annex X §X.7; the profile data |
