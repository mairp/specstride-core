# Contracts of feature 149

Feature 149 exposes nothing to a host. What it exposes inside the product is below. Where a file
here and the spec differ, the spec stands; where the spec and feature 100 differ, feature 100
stands.

| File | Content | Requirements |
|---|---|---|
| `ep18-seams.md` | The two seams of EP-18: operations, inputs, outputs, failure, the conformance suite | F149-FR-001, F149-FR-002, F149-FR-010 |
| `bump-table.json` | The rule table of the model-tier bump, in the form `specstride.table/1` | F149-FR-003 to F149-FR-006 |
| `ablation-tier-bump.md` | The ablation arm of the bump. Written by a task | F149-FR-006 |
| `gate-writers-rule.json` | The import rule on the writers of the phase gate, in the rule form proposed to feature 100 (`analyze-report.md`, "Proposed upstream fixes", P2). The router of the micro-loop layer lives in `packages/layer-micro/src/router/`, so the first entry of `from` covers it; the two modules of `forbid` are the writers of the phase gate as the first part of the split places them | F149-FR-007 |

In the product, the bump table is the frozen constant `packages/core/src/ep18/bump-table.ts`,
equal to `bump-table.json` (task T003); it is not placed in `packages/contracts/data/`, which the
sync script of feature 100 clean-copies from feature 100's own contracts.

The reason of a skipped bump is derived from the rule that fired: `TB-04` gives `ladder-top`,
`TB-05` gives `critic-model`, `TB-06` gives `quota-exhausted`. The table form of feature 100 has
no field for it, and none is added.
