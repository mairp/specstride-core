# Research: Reverse specification (feature 108)

Phase 0 of the plan. The research of this effort stays in `docs/ecosystem/`; this file says which report settles what, records the decisions of the plan, and lists what is `unverified`.

## Sources

| Subject | Source | Used for |
|---|---|---|
| Behaviour items | `docs/ecosystem/research/R18-behaviour-inventory.tsv`; `traceability-items.tsv` (158 items of this feature after the split) | Every requirement |
| As-is requirements | `old/028-as-is-specstride/spec.md` FR-025, FR-026, SC-006 | F108-FR-024 to F108-FR-031, F108-SC-001 |
| Baseline code | the Specstride baseline at `9cab15d`, `lib/reverse.py` | Message texts, limits, the plan and the guard |
| Rulings | `APPROVAL.md` rulings 15, 25, 64, 65, K6, K7, K8 | Group split; run request; budgets; exit codes |
| Layout and logical names | `specs/100-specstride/annexes/B-state.md` §B.5 | Where the reverse files lie |
| Run request, handshake | annex F §F.2, §F.3 | F108-FR-009 |
| Exit codes | annex G §G.4; `consolidation.md` section 3.6 | F108-FR-004, F108-FR-006 |
| Oracle | `specs/141-parity-oracle/spec.md` FX-30, §O.4, §O.6 | Tests |
| Architecture | R15 A-7 (run request), A-9 (sizes); R15v E-6 (140 merged into 108); R17 (budgets); R2v (hashing speed); R1 (MIT templates) | Plan |

## Decisions

### D-1 Foreground by default, `--detach` for the run request
- **Decision**: `reverse` without `--detach` runs the engine in the foreground; the host skill passes `--detach`.
- **Rationale**: the baseline's wrapper executes the engine and returns its code; making detached the default would need a register row and a waiver on FX-30.
- **Alternatives considered**: detached by default with a register row (rejected: a difference nobody asked for); a separate command (rejected: two spellings of one behaviour).

### D-2 Logical names for arguments of the commands in the driver
- **Decision**: the commands in the driver and in the verification-commands document carry the resolved location of the baseline inventory, resolved at plan time from the logical name.
- **Rationale**: the proposer must be able to run them; the location is a physical path, so it is plan data and does not enter the specification.
- **Alternatives considered**: a CLI that accepts logical names as arguments (rejected: it would add a rule to annex G that binds other features).

### D-5 The driver lies in the workspace part
- **Decision**: keep annex B §B.5's placement; detect a change through the source hashes.
- **Rationale**: the proposer reads the driver; the source hashes of the run snapshot (F100-FR-067) notice an edit at every pass start, and at the critic start under `parity`. The baseline had the same exposure.
- **Alternatives considered**: the driver in the control plane and a copy in the prompt (rejected: moves a rule of feature 103).

### D-7 Split
- **Decision**: group G-B (the inventory, the lint, the templates) is feature `140-reverse-inventory-and-lint`; the guard stays here.
- **Rationale**: 60 requirements were above the mark of about 45. The guard compares against a baseline inventory; the format of that inventory has no contract in feature 100 (reported).

## Facts that are `unverified`

| Fact | Check |
|---|---|
| A run request of kind `engine` survives the end of the host session | The spike of feature 122 |
| Git output forms on macOS | The FX-30 guard fixtures on a macOS runner |
| Opening files without following links behaves the same on macOS | A test on a macOS runner |

## Gaps in feature 100, reported and settled

| # | Gap as it was reported | State on 2026-09-30 |
|---|---|---|
| 1 | The CLI writes two control-plane names of reverse at `plan`, against F100-FR-003, F100-FR-004, F100-FR-217 | Settled: F100-FR-003 names the records of a reverse plan among the files the CLI writes (CQ-092) |
| 2 | No logical name for the scratch claims file, the plan of tests, the scaffolds of a reverse run | Settled: `reverse:<slug>:claims:<unit-key>`, `reverse:<slug>:test-plan`, `reverse:<slug>:scaffolds` are rows of annex B §B.5 |
| 3 | No row in annex X §X.7 for `reverse.tasks`, `--detach` and `--comment` | Settled: rows 66, 67 and 68 of §X.7 |
| 4 | No contract for the inventory format that the guard and the plan read | Settled: `specstride.reverse-inventory/1` is a row of annex B §B.20, owner 140 |
| 5 | Annex G has no `--detach` on `reverse` and no name for the comment argument | Assumed as CQ-090 and CQ-091; the owner has not ruled |
