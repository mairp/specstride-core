# Quickstart: validating the harness seam (feature 109)

A guide to prove that the feature works, once it is built. Nothing here calls a model or a paid
service, apart from scenario 7, which runs only on request. No scenario starts an interpreter of
another language.

## Prerequisites

- Node.js 22 or later; the workspace installed with `npm install`
- For the parity tests: the oracle of feature 141 with its golden captures
- For the scenario `FX-26/root-sandbox-assertion` of scenario 4: the effective user id 0; without it the scenario is a skip with its reason, and a skip blocks a release
- For scenario 6 on Linux: a sandbox of the operating system that the fake binary can declare; without it the test is a skip with its reason

## Scenarios

| # | Scenario | Command | Expected |
|---|---|---|---|
| 1 | Conformance suite on the sample outside the core | `npm test --workspace @specstride/testkit -- conformance/EP-02 samples/EP-02` | Every case of `contracts/conformance-cases.json` passes; no connection beyond loopback |
| 2 | Descriptor-only fixture | `npm run test:conformance -- descriptor-only` | A run completes with the fake CLI as proposer and the fake endpoint as critic, and again with the fake CLI as critic; the build with and without the two descriptors differs in 0 product files (F109-SC-001) |
| 3 | The core names no harness | `npm run test:boundary` | 0 hits (F109-SC-002) |
| 4 | Parity of the invocation | `npm run test:parity -- 109` | Every `PT-109-*` gives `equal` or `waived` (F109-SC-004) |
| 5 | Overlay leaves nothing behind | `npm run test:parity -- 109 --fixture FX-39` | After `scope-pass`, `scope-attempt`, `scope-attempt-signal` and `populate-fails`, the surface `home` shows no overlay tree |
| 6 | No critic can act | `npm test --workspace @specstride/harness -- proof` | With the proof: accepted. Without: `critic_not_toolless`, engine exit 3, stop reason `critic_config`; a write and a reach for the network are recorded as refused |
| 7 | Verification of a declared harness (live, on request) | `specstride harness verify <id>` with a stated budget | Exit 0 and a stored result at `user:harness-verify:<id>` with the fields `schema`, `harness`, `version`, `descriptorHash`, `at`, `outcome`, `cases`, `budget`; exit 2 when a case fails; exit 3 without a budget or for an unknown id |
| 8 | A descriptor in project configuration | Launch a fixture whose project configuration declares a harness | The descriptor is ignored; a launch message and a doctor warning |
| 9 | No containment needs the opt-in of the user configuration | `npm test --workspace @specstride/harness -- containment` | A proposer with the ceiling C0 is refused at launch; `sandbox.level` set to `C0` in the environment, by a flag or in project configuration gives no opt-in; set in user configuration it does (F109-FR-026) |
| 10 | The line for a registry that cannot be read | `npm run test:characterization -- 109` | The as-is line in compatibility output; help succeeds (F109-FR-006, CT-109-109) |

## Where to look

- The closed sets and the rules of the overlay: [contracts/](contracts/README.md)
- The entities and their fields: [data-model.md](data-model.md)
- What each test proves: [tasks.md](tasks.md), fields `proves:` and `fixture:`
