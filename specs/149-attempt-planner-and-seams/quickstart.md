# Quickstart: validating feature 149

How to see that the seams and the bump work, once the tasks are done. Names of scripts are
proposals of the plan.

## Prerequisites

| Need | For |
|---|---|
| Node.js 22 or later; `npm install` at the root of the workspace | Everything |
| The stubs and fixtures of the parity oracle (feature 141), port side | The own tests that run a fixture |

No reference tree is needed: this feature has no parity test. A missing prerequisite is reported
as a skip with its reason, never as a pass.

## 1. The seams

```text
npm run test:conformance -- --ep 18
```

Expected: the suite of [contracts/ep18-seams.md](contracts/ep18-seams.md) passes on the sample
strategy, the sample planner and both planners of Wave 1 (CT-149-10). The build with the samples
and the build without them differ in no core file.

## 2. Own tests

```text
npm run test:own -- --feature 149
```

| Test | Expected |
|---|---|
| CT-149-1 | Every critic call is a fresh session that no pass used; the proof of the form is recorded; the critic-diversity warning is raised (for `same-model` and for `unverified`) and does not block; a failing strategy gives MALFORMED |
| CT-149-2 | A planner is pure; a planner that throws and an unknown kind give `plain` |
| CT-149-3 | Option off: no surface of any fixture differs. Option on, K rejections by the critic: the next phase attempt runs on the next model tier |
| CT-149-4 | K − 1: no bump. A failed verification gate and a MALFORMED verdict add nothing. At most one bump per phase. The next phase starts on the base model tier |
| CT-149-5 | Target equal to a critic-class call in model and effort, exhausted quota, top of the ladder: skipped, recorded with the rule id. A target that shares only the model: used, with the critic-diversity warning. Fresh session after a bump. Nothing of it reaches the critic |
| CT-149-6 | Golden decisions per row of the bump table; exactly one row fires for every vector of signals |
| CT-149-7 | The verdict parser returns no verdict for any ledger record or fact-block row; one writer of the records of the phase gate; equal counts with a loop layer on |
| CT-149-8 | A changed tree at phase entry is a fact for the critic and does not block |
| CT-149-9 | With a changed protected set the phase gate runs and an approval stays possible |

## 3. Switching the bump on by hand

| Step | Command of CLI protocol 1 | Expected |
|---|---|---|
| Set the option | `specstride run --set attempt.tier_bump=on --set attempt.tier_bump_after=2` with stub agents that reject | The third phase attempt of the phase runs on the next model tier |
| Read what happened | `specstride events` | One event of a bump, or of a skip with its reason, with the rule id |

References: [spec.md](spec.md), [data-model.md](data-model.md), [contracts/](contracts/README.md).
