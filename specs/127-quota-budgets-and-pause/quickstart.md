# Quickstart: validating feature 127

For a reader who wants to check that the specification is complete before implementation.

1. Read `spec.md`: the reference sections §Q.1 to §Q.5, then the 41 requirements.
2. Open `contracts/` and check each file against the spec: the classifier table, the pattern groups, the closed sets, the ledger schema.
3. Run `python3 docs/ecosystem/check-traceability.py` from the repository root and look at the lines that start with `[h` and name `127-quota-budgets-and-pause` or `F127`. There should be none.
4. Follow one case: a limit signal with a reset time. §Q.1 row `quota_window`, F127-FR-010, F127-FR-013, `contracts/classifier.table.json` rule Q-01, the task in `tasks.md` that proves it.
5. Follow the money case: a subscription-to-API-key fallback. F127-FR-021, §Q.4, the task for CT-127-23.

Implementation checks, once code exists (not run in Stage B):

| Check | Expected |
|---|---|
| A fixture harness with a declared limit signal | The run enters `paused-quota`; the six counts are unchanged; the run resumes at the reset plus margin |
| A pause that outlasts `pause.maxTotalMs` on a fake clock | `blocked-on-human`, `paused_quota_ceiling`, exit 4 |
| FX-23 and FX-18 under the `parity` profile | 0 results `different` |
| A cost ceiling of 10 units, 3 units per call | Real spend after the stop is at most 12 |
| The ledger file made unreadable, then `resume` | Spend is not lower than before, or the run stops with `budget-cap` |
| A fallback to an API-key entry | The `loud` alert precedes the first usage record on the key; an entry without a cap is skipped |
| The sample classifier from the test tree | Passes the conformance suite of EP-12 with 0 core files changed |
