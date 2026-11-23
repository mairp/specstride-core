# Quickstart: validating feature 146

A guide to the scenarios that prove the feature. It holds no implementation. Commands are those
of CLI protocol 1 (feature 100, annex G §G.1); fixtures come from the test kit. Nothing here
calls a model or a host other than loopback.

## Prerequisites

| Need | Why |
|---|---|
| Node.js 22 or later; `npm install` at the repository root | The workspace |
| The test kit's fake CLI (`stub-harness`) and fake endpoint on loopback | Candidates without a tested harness adapter |
| On Linux, `strace` | The operating-system trace of scenario 1; without it the trace is a skip with its reason |

## Run the tests of this feature

```text
npm test --workspace packages/harness -- --test-name-pattern "146"
```

Expected: every `CT-146-*` passes. This feature has no parity test.

## Scenario 1: discovery touches nothing (F146-SC-002)

1. Use the fixture home with planted credential files in known configuration homes.
2. Run the doctor under the guarded reader's trace and the operating-system trace.
3. Expected: 0 opens of a planted file; 0 writes; the fake CLI is in the list as `detected`.
4. Put an executable on the search path that no harness descriptor names. Expected: it is never started.
5. Make the fake endpoint answer its model list with a redirect. Expected: the probe fails, the second host saw no request, the window stays null.

## Scenario 2: a harness without a tested harness adapter (F146-SC-001)

1. Use the descriptor-only fixture of the harness port.
2. Run the doctor with `--json`. Expected: the fake harness is in the field `registry` as unverified; every value has a provenance or is null.

## Scenario 3: a probe that never answers (F146-SC-003)

1. Use twenty harness descriptors, one of whose version commands never ends.
2. Expected: discovery ends no later than one second after the time limit of a probe; nineteen candidates have a version, one has null and a finding.

## Scenario 4: where a window comes from (F146-FR-016)

1. Use four harnesses: a declared window, a window from the model list, a window from the catalogue, none.
2. Expected: the ladder steps `metadata` and `catalogue` on the second and third; the third reduced by the margin; the fourth null.

## Scenario 5: promotion and its end (F146-FR-018)

1. Place a passed result of harness verification for a declared harness. Expected: state `locally-verified`.
2. Make the fake CLI report another version. Expected: state `declared`, and a doctor finding.

## Scenario 6: the switches (F146-FR-012)

1. Set `discovery.enabled` to off. Expected: no process is started and no request is made.
2. Select the `parity` profile. Expected: the same, and no line of this feature is printed.

## Not run here

Two live probes are tasks that are logged and run by a person: whether a model-list endpoint is
unbilled, and whether a gateway lists models of other providers. Neither is paid; both use a
real credential.
