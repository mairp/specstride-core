# Research: Micro-loop layer (feature 115)

Phase 0 of the plan. The research of this effort stays in `docs/ecosystem/`; this file says which
report settles what, records the decisions of the plan, and lists what is `unverified`.

## Sources

| Subject | Source | Used for |
|---|---|---|
| The reconciled design | `docs/ecosystem/research/R27-run-acceleration-synthesis.md`, D1.1 to D1.13, D-01 to D-20, experiments | Every requirement group |
| Integrity rules IR-01 to IR-30, resume states, the `[LOOP]` line | `docs/ecosystem/research/R23-inner-checks-gate-integrity.md`, F-15 to F-18 | Every group |
| Integrity rules IR-31 to IR-57 | `docs/ecosystem/research/R23v-gate-red-team.md` | The rules the layer owns; the verifier stands over R23 |
| The router and escalation | `docs/ecosystem/research/R25-routing-cascades.md`, RT-A to RT-H | F115-FR-033 to F115-FR-036 |
| Beneath the layer of parallel units | `docs/ecosystem/research/R29-parallel-units-design.md`, "Beside the micro-loop layer", PU-49, PU-50 | F115-FR-042 |
| Loop parameters | `docs/ecosystem/research/R22-loop-design-survey.md` | Caps; read through R27 |
| Baseline of time use | `docs/ecosystem/research/R21-time-use-baseline.md`, `R21v-baseline-recompute.md` | Success criteria; read through R27 |
| Threats T-19 to T-25 | `docs/ecosystem/research/R11-security-threat-model.md`; feature 100 annex X §X.9 | Threat table of the spec |
| Rulings | `docs/ecosystem/APPROVAL.md` rulings 3, 4, 5, 38 to 42, 44 to 48, 50, 51, 53, 56, P1 | Every group |
| Contracts | `specs/100-specstride/annexes/` A, B, C, D, E, G, X | Interfaces |
| Second suite | `specs/141-parity-oracle/spec.md`, F141-FR-039 to F141-FR-042 | Inertness |

## Decisions

### D-1 The layer is pure; the file system is behind services

- **Decision**: `@specstride/layer-micro` holds logic only and does not import `node:fs` or `node:fs/promises`. The reading of a checkpoint and the tripwire record stand behind ports of the edge package `@specstride/integrity` and write with the atomic write of the kernel. The task list as read at launch is `run:<runId>:task-list`, written by the engine; the layer reads it and stores nothing. Fingerprints and the builder of the fact block reach the layer as inputs and services of the engine (annex D §D.1 of feature 100).
- **Rationale**: F100-FR-012 forbids a core package to start a process, to import the file-system module of the platform, or to import anything but `contracts` and `kernel` (`assumption: CQ-185`). F100-FR-234 gives the atomic write to the kernel and the file access to the ports of the edge packages. Annex D §D.1 lists "fingerprints" among the inputs of a layer.
- **Alternatives considered**: file access inside the layer (breaks the import rule).

### D-2 The router is consulted only once the layer is engaged

- **Decision**: no decision of the router in a phase attempt without an accepted checkpoint. The fallbacks of a run are decided by the selection of the strategy at launch.
- **Rationale**: annex D §D.4 makes every decision an event. The layer allowlist of the second suite holds two event types and no routing event. Rule IR-52 says the layer executes nothing without a declared unit.
- **Alternatives considered**: a decision at the entry of every phase attempt (needs a new register row and a new allowlist entry); R25's up-front choice of the kind of loop per phase (R27 D-13 rejected it).

### D-3 Fallbacks `single-unit` and `no-check` are decided at engagement or after a unit

- **Decision**: `single-unit` at the first accepted checkpoint; `no-check` after two consecutive `unchecked` units with an empty inner set.
- **Rationale**: follows from D-2 and from R27 D1.5 ("also after 2 consecutive `unchecked` units when the inner set has become empty").
- **Alternatives considered**: at launch from the manifest and the task list (the announcement would be a difference in the second suite that no register row names). Reported as CQ-081.

### D-5 The failure signature holds no output

- **Decision**: the ordered list of failed command ids with exit codes.
- **Rationale**: R27 D-19; output of a check is untrusted text.
- **Alternatives considered**: a normalised digest of the output (R25; rejected by R23v V-20).

### D-6 No randomised escalation during the evaluation

- **Decision**: experiment X10 compares arms by the paired design.
- **Rationale**: R25 RT-H proposes a logged 50:50 choice at each trigger. The router is a pure function without randomness (F100-FR-129, F100-FR-204).
- **Alternatives considered**: a precomputed assignment given to the router as a signal (adds an option to the product that exists for one experiment only).

### D-7 The caps are configuration keys of the class narrowing

- **Decision**: eleven keys, `loop.routing` (row 64 of annex X §X.7) and ten under `loop.micro.caps.*` (row 65). The three that carry minutes end in `Min`: `proposalMin`, `unitMin`, `checkMin` (`assumption: CQ-160`).
- **Rationale**: every numeric default is a starting value for X7 and X8; an experiment must be able to change it. Project configuration may lower a cap and never raise it (F100-FR-202).
- **Alternatives considered**: fixed constants (the experiments could not vary them).

### D-9 No edge package of its own

- **Decision**: withdrawn on 2026-09-30 (item W-X-01). The first plan proposed `@specstride/layer-micro-io`, layer L1, owner 115. The code that touches the file system stands in two directories of `@specstride/integrity`, behind ports whose interfaces are in `@specstride/contracts`.
- **Rationale**: the package graph of feature 100 holds no such package, and F100-FR-234 names three edge packages in Wave 1 and no fourth.
- **Alternatives considered**: a package of its own (needs an amendment of annex A §A.1); a directory of the engine's package (the engine is a core package and may not import the file-system module).

### D-11 Escalation and the model of the critic

- **Decision**: `targetIsCriticModel` is true only when the rung equals a critic-class call in model and in effort. A rung that shares the model alone is used; the signal `targetSharesCriticModel` is recorded with the decision and the critic-diversity warning is raised.
- **Rationale**: F100-FR-130 as repaired; rulings 46 and 49; `assumption: CQ-191`. DP-052 states that the other reading skips escalation in most Claude-only runs.
- **Alternatives considered**: skip every rung on the model of a critic-class call (the reading before the review; it is the consequence if CQ-191 is answered otherwise). A second row of the table with a choice of its own for the warning (the choice set of row 67 has no such member).

### D-10 The split

- **Decision**: requirement group G-B is feature `116-check-integrity-and-unit-evidence`. This feature keeps the ids F115-FR-001 to F115-FR-042 and F115-FR-064 to F115-FR-066. The two parts meet in annex C §C.8 and §C.14 and annex D §D.1 and §D.7 of feature 100.
- **Rationale**: `speckit-specify` gave 66 requirements; the brief names the groups (heading 7).
- **Alternatives considered**: none; the orchestrator decided the split.

## Unverified

| Item | Check that would verify it |
|---|---|
| Every statement about macOS: opening without following links, ending the process group and session of a pass, the file list of the version control tool | A macOS runner passes the tests of this feature |
| That a discovered harness completes a phase at L1 | The descriptor-only fixture (F115-SC-005) |
| Every numeric default | Experiments X5, X7, X8 |
| The duration of an inner check | The records of F115-FR-064 |
| That the fact block does not lower the critic's detection of seeded defects | Experiment X12 (iv), live critic calls, paid and logged |
| The central estimates of savings | Experiments X1, X5, X6 |

## Open points reported to the orchestrator

CQ-080 to CQ-084 and CQ-086 of `spec.md`, and the owner of closed set row 63. Settled since:
CQ-181 (the answer is applied in annex B §B.5), the rows of the profile (rows 64 and 65 of annex X
§X.7), the package `@specstride/layer-micro-io` (withdrawn), the event types (the catalogue of
feature 111 holds them). Open after the cross-feature review: the owner field of
`@specstride/integrity` in the package graph, and the other points of `repair-report.md`.
