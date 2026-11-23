# Quickstart: validating feature 124 (after the split)

A guide to the scenarios that prove the feature. It holds no implementation. Commands are those
of CLI protocol 1 (feature 100, annex G §G.1); fixtures come from the test kit. Nothing here
calls a model or a host other than loopback.

## Prerequisites

| Need | Why |
|---|---|
| Node.js 22 or later; `npm install` at the repository root | The workspace |
| The test kit's fake CLI (`stub-harness`) and fake endpoint on loopback | Candidates without a tested harness adapter |

## Run the tests of this feature

```text
npm test --workspace packages/harness -- --test-name-pattern "124"
```

The parity tests and `CT-124-50` live in `tests/parity/124/` and `tests/characterization/124/`
and run with the oracle of feature 141.

Expected: every `CT-124-*` passes; the parity tests `PT-124-*` report `equal`, and the scenario
`FX-01/defaults-no-role-named` reports `waived (DV-004)`. `PT-124-C-057-usage-list` is a skip
until a scenario prints the usage text of the pass loop; `CT-124-50` proves that item.

## Scenario 1: a diverse critic without configuration (F124-SC-001)

1. Use the extended descriptor-only fixture: a harness descriptor for the fake endpoint in user configuration, a cost class that is not `metered`, a declared context window, no critic configured.
2. Launch a run in default output.
3. Expected: one line `[SPECSTRIDE-CRITIC]` with `step=discovered` and the id of the fake endpoint; the event `critic.selected` with the same id; the digest names it; the resolved registry holds `criticPick.automatic` true.
4. Set `critic.autoPick` to off and launch a new run. Expected: `step=default-model-tier`.

## Scenario 2: the proposer guarantee (F124-SC-005)

1. Use a list of harnesses without the default harness and with the fake CLI.
2. Launch. Expected: outcome `refused`, exit 4, one line `[SPECSTRIDE-ROLES]` that names the fake CLI as a candidate; no run state.

## Scenario 3: both critic forms and a pass-over (F124-FR-040, F124-FR-041)

1. Use the table fixture with three candidates: tool-less and `declared`; read-only tools and `tested`; tool-less and `tested`.
2. Expected ranking: tool-less `tested`, tool-less `declared`, read-only tools `tested`.
3. Remove the two tool-less candidates and make the harness adapter of the third not confirm the read denial. Expected: the candidate is passed over with `read-denial-unconfirmed`, step 4 is used, a line and an event say so.

## Scenario 4: the critic-diversity warning (F124-SC-004)

1. Name the same harness and model for both roles.
2. Launch. Expected: the critic-diversity warning, as one line `[SPECSTRIDE-DIVERSITY] result=same-model`, the record and an event; the launch proceeds with exit 0.
3. Name two models of one provider. Expected: the result `same-provider` in the record and no warning.

## Scenario 5: resume replays (F124-SC-006)

1. Launch, stop, add a better candidate to the list of harnesses, resume. Expected: the plan is byte-identical.
2. Resume with `--resolve-roles`. Expected: a new plan, announced and recorded.

## Scenario 6: the baseline's unknown name (F124-FR-029, F124-FR-030)

1. Under the `parity` profile, name a proposer that the registry does not hold. Expected: every pass result is 127 with the as-is message; the run ends by a breaker or by the pass limit (scenario `FX-18/unknown-harness-name`).
2. With the default settings, the same name. Expected: the launch is refused with the rendered list of the registry.

## Not run here

This part has no live probe and no paid probe.
