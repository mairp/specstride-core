# Implementation Plan: Check runner (feature 148)

**Branch**: `148-check-runner` (a label; the directory is `specs/148-check-runner`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/148-check-runner/spec.md`

## Summary

Feature 148 is the one component that runs a deterministic command for a check. It owns the
content of EP-05: the operations `pin`, `start`, `poll`, `result` and `cancel`, the kind
`command`, the option `steps`, the conformance suite and the sample. It also owns the option of
concurrent verification commands.

| Deliverable | What it is | Requirements |
|---|---|---|
| Runner registry and operations | Handle-based interface; `pin` at launch | F148-FR-001 |
| Kind `command` | Fixed argument list, no shell, process group, allow-list, time limit, output cap | F148-FR-002, F148-FR-004 |
| Result model | Conditions and reasons in fields of their own; unknown values | F148-FR-003 |
| One runner, guarded start | The same runner for every check; no start while a pass lives | F148-FR-005 |
| Fingerprint bracket | Two readings around a command; taint; the protected-set fact | F148-FR-006 |
| Events | `check.started`, `check.ended` with the batch fields; `check.admission`; `check.parallelism_lowered`; `integrity.noted` | F148-FR-007, F148-FR-010, F148-FR-012, F148-FR-014, F148-FR-017 |
| Step runner | Steps, stop at the first failed required step, resume, `partial` | F148-FR-008, F148-FR-009 |
| Integrity with the layer off | Manifest hash, pin, search path | F148-FR-010 |
| Concurrent commands | Admission, formation, isolation, bracket of a batch, order, second execution | F148-FR-011 to F148-FR-016 |
| Conformance | Suite and sample of EP-05 | F148-FR-018 |
| Environment for a detached staged command | The operation `environment` of EP-05 (proposal P1 of `analyze-report.md`): the environment of the kind `command`, given without starting a process | F148-FR-019 |

Approach: batch formation is a pure function of the manifest and the parallelism, so its result
is tested without running a command (`research.md` D-3). The executor of Lisa's verification
package is extracted as source where it fits (`research.md` D-1).

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schema of the check manifest and of the fact block, closed sets, the `parity` profile, logical names, the interface types of EP-05 and EP-16); `@specstride/kernel`. Node built-ins: `node:child_process`, `node:fs`, `node:path`, `node:crypto`, `node:os`. No dependency from npm beyond the schema validator that feature 100 chose

**Storage**: none of its own. Results are returned values; the caller writes them under its logical names (feature 100, annex B §B.5). The record at `unit:<unitId>:check:<i>` is `specstride.check-result/1` of feature 116 (`data-model.md`, "Mapping to the stored record"). Captured output lives in a temporary directory per command and is removed after the result was taken

**Testing**: the test runner that Node ships (`node:test`); scripted commands as fake binaries; the conformance frame of `@specstride/testkit`; the parity oracle of feature 141 for four items (FX-06, FX-14, FX-15, FX-16). No test calls a model or a paid service

**Target Platform**: Linux and macOS. Process groups on macOS are `unverified` until a macOS runner has passed the oracle (ruling 67)

**Project Type**: one package of the npm workspace: `@specstride/check-runner`, layer L1, owner 148, as the package graph of feature 100 gives it (`specs/100-specstride/contracts/data/package-graph.json`); it may import `@specstride/contracts` and `@specstride/kernel`

**Performance Goals**: starting values with low confidence, measured in the build. Overhead of the runner per command, without the fingerprint readings: under 50 ms. Batch formation for 100 entries: under 10 ms. End of a process group after a time limit: within 5 s

**Constraints**: no shell to run a command; no native module; no provider credential in the environment of a command outside the `parity` profile; output cap 64000 characters per stream; no write to the control plane by a command; MIT-compatible dependencies only; no path, account or name of the owner's machines

**Scale/Scope**: 19 functional requirements, 7 success criteria; 4 behaviour items of cluster C-080 carried; 4 fixture families cited; 1 conformance suite and 1 sample; 6 rows of the `parity` profile read (1, 6, 7, 25, 31, 125); 5 rows of closed sets of annex X §X.6 stated (53, 54, 233, 235, 236)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. ✅ The runner is called in-process by the engine and keeps no service. It returns results; files are written by the caller atomically. A check starts only after the pass has exited (F148-FR-005)
- [x] II. ✅ A result of the runner is never a verdict and never an approval. A failure inside the runner produces no verdict, exit code or stop reason (F148-FR-018)
- [x] III. ✅ Commands are fixed argument lists from the frozen manifest, run by the runtime and never by the harness of the proposer (F148-FR-002, F148-FR-005). A check against a changed set is `tainted`, never a pass (F148-FR-006, F148-FR-010). Output of a command is data and passes the one ingress (F148-FR-007)
- [x] IV. N/A. The runner reads no spec
- [x] V. ✅ Events of a check are best-effort; a failed emission never changes a result (F148-FR-007)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the manifest entry and the result are validated at the boundary; imports `contracts` and `kernel` only; plain `npm install`; no native module; the Language Ledger stays empty. Extension points: implements EP-05 `specstride.check-runner/1`; consumes EP-16 `specstride.toolchain/1` and EP-08 `specstride.event-sink/1`
- [x] VII. ✅ The feature names no harness and tests no harness name. The containment level of a check is read from the role plan of the run
- [x] VIII. N/A for the pass. ✅ for what the runner touches: a command never waits for a human (standard input closed, a time limit); the configuration of the operator is not written
- [x] IX. N/A. The feature calls no critic
- [x] X. N/A. No harness adapter. Executables of checks are pinned with size and hash (F148-FR-001)
- [x] XI. ✅ Events use the one envelope; an unknown exit code is null; a duration measured in a batch is flagged (F148-FR-004, F148-FR-017); no output of a command is in an event
- [x] XII. ✅ Tests use scripted commands; no paid call; no credential reaches a command (F148-FR-002); no model id anywhere in the feature

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Admission to a batch is decided by a pure function and recorded with its reason (F148-FR-012)
- [x] XIV. ✅ The runner adds no command and builds no argument list. A unit or phase without a command gives `unchecked`, never a pass and never a rejection (F148-FR-003)
- [x] XV. N/A. No launch, no mode, no comment
- [x] XVI. ✅ The lowered parallelism survives a resume and a relaunch, in the field `verificationParallelism` of the run record (F148-FR-014; when the engine is a child, through the field `verificationParallelism` of its terminal record, which the runtime root copies: CQ-180, proposal P2 of `analyze-report.md`). The runner spends no count of the run
- [x] XVII. ✅ A test whose prerequisite is missing is a skip with its reason; macOS statements are `unverified`
- [x] XX. ✅ Commands run side by side only with declared reads and writes that do not meet; the declarations come from the check manifest and never from repository text (CQ-190); undeclared means serial; every admission is recorded; results are ordered by manifest position; no exit code and no stop reason is added (F148-FR-011 to F148-FR-017)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ The four carried items have origin, disposition and test. Intended differences cite DV-052, DV-076, DV-080 and DV-113. Every option is off or as-is under the `parity` profile
- [x] XIX. ✅ The runner prints nothing into a host session; its share of the token budget is 0 bytes

Every check passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. The design adds no dependency and no process that
outlives a check.

## Project Structure

### Documentation (this feature)

```text
specs/148-check-runner/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── closed-sets.json
│   ├── parity-rows.json
│   ├── batch-rules.json
│   └── as-is-literals.json
├── tasks.md
├── analyze-report.md
└── repair-report.md
```

### Source Code (repository root)

```text
packages/check-runner/               # @specstride/check-runner (L1, owner 148)
├── data/
│   └── env-allowlist.json           # names a command may see
├── src/
│   ├── registry/                    # EP-05 registry; pin; handles; the operation environment
│   ├── command/                     # the kind command: spawn, group, limit, cap, environment
│   ├── result/                      # conditions, reasons, errors, unknown values
│   ├── guard/                       # no start while a pass lives; manifest hash; pin; search path
│   ├── bracket/                     # the two fingerprint readings; taint
│   ├── steps/                       # the step runner
│   ├── batch/                       # admission, formation, isolation, second execution, demotion
│   └── events/                      # check.started, check.ended, check.admission, check.parallelism_lowered, integrity.noted
└── test/
packages/testkit/src/conformance/EP-05/   # feature 100 builds the contract-level suite; this feature adds its cases
packages/testkit/src/samples/EP-05/       # the sample check runner
tests/
├── parity/148/                      # PT-148-*
├── characterization/148/            # CT-148-*
└── fixtures/148/                    # scripted commands, manifests
```

**Structure Decision**: one package of the npm workspace, `@specstride/check-runner`, which the
package graph of feature 100 names with the owner 148.

## Complexity Tracking

No violation.
