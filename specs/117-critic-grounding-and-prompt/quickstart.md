# Quickstart: validating feature 117

Prerequisites: Node.js 22 or later; the workspace installed with `npm install`; for the parity
scenarios the package `@specstride/oracle` of feature 141 with its golden captures. No credential
and no network are needed.

| # | Scenario | Command | Expected |
|---|---|---|---|
| 1 | Unit tests of the modules | `npm test -w @specstride/core -- critic-input` | All pass |
| 2 | Parity of the grounding snapshot and the prompt | `npm run parity -- --feature 117` | FX-25, FX-02 and FX-05: every surface `equal`; `FX-25/evidence-cites-state-path` is `waived (DV-032)` |
| 3 | Refused roots | `npm run characterization -- CT-117-18` | 21 of 21 citations not grounded (F117-SC-005) |
| 4 | Same final state in 1 and in 9 cycles | `npm run characterization -- CT-117-27` | The two prompts differ in the two tokens of the call only (F117-SC-003) |
| 5 | Window fit | `npm run characterization -- CT-117-24 CT-117-25 CT-117-33` | No call over the budget; every reduction stated (F117-SC-002) |
| 6 | Hiding and return | `npm run characterization -- CT-117-40 CT-117-40-port CT-117-41 CT-117-42` | Three files absent during the call and byte-identical after it, for five ways of ending; no call without confirmation (F117-SC-006) |
| 7 | Coverage | `python3 docs/ecosystem/check-traceability.py --require-all` | `PASSED`; no line that names feature 117 |
| 8 | Import rule and the one ingress | `npm test -w @specstride/core -- critic-input/imports` and `npm run characterization -- CT-117-44` | No file of `critic-input/` imports `node:fs`; a planted secret is in no sink |

Data to look at: [contracts/as-is-literals.json](contracts/as-is-literals.json),
[contracts/budgets.json](contracts/budgets.json), [data-model.md](data-model.md).

A test that needs symbolic links or a macOS host reports a skip with its reason where the
prerequisite is missing.
