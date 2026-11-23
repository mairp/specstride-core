# Research: Pipeline runtime and supervisor (feature 123)

Phase 0 of `speckit-plan`. The research of Stage A lives in `docs/ecosystem/research/`; this file
summarizes what this feature took from it and links to it. Nothing here was measured by this
feature: every figure is from a report, and every macOS statement is `unverified` (ruling 67).

## Sources read

| Source | What it gave |
|---|---|
| `docs/ecosystem/research/R15v-architecture-red-team.md` B-1, C-2, C-3, P-1, P-8 | The relaunch classifier cannot move into the root unchanged; `relaunch.owner`; a second table with a crash row; `hold-relaunch`; `supervise` is a writer and gets its own file |
| `docs/ecosystem/research/R15-ecosystem-architecture.md` F-01, F-03, A-7, A-8 | The stage executor in the root; the stage graph is serial and the resume predicate is defined over groups |
| `docs/ecosystem/research/R19-consolidation-map.md` | The dispositions of 011 FR-011 to FR-023 |
| `docs/ecosystem/research/R18-behaviour-inventory.tsv` | The 178 behaviour items of the 19 clusters (`traceability-items.tsv`) |
| `docs/ecosystem/research/R14-quotas-cost-observability.md` | A quota pause is a state, so the classifier has nothing to classify |
| `docs/ecosystem/research/R17-context-efficiency-runtime-language.md`, R21, R21v | The token budgets (150, 250, 3,000), and the 135 to 143 manual restarts of the reference run |
| `docs/ecosystem/research/R16-doctor-config.md` F2 | The launch checks are doctor checks; a held workspace lock is reported before launch |
| `docs/ecosystem/research/R11-security-threat-model.md` T-11 | The digest is produced by the runtime from events and printed verbatim by the host |
| `docs/ecosystem/research/R29-parallel-units-design.md` PU-15; `R29v` PU-98 | The parallel plan is printed by the dry run only with the option on |
| Baseline `9c88f86`: `runtime.py`, `supervisor_lib.py`, `supervise.py`, `contract_lib.py` | The literals, the order of the checks and of the classifier conditions, the cadence, the launch record |

## Decisions

### D-1 Two classifier tables, one closed family of literals

- **Decision**: table 1 reproduces `classify_relaunch` row by row in its fixed order and serves `supervise observe`; table 2 serves the runtime root and has rows for a signal-stopped root, a blocked run, a lost lease, a non-retryable stop, a held relaunch and a crashed engine. Since 2026-09-30 table 1 has two rows beyond the baseline, O-33 for a blocked run, active under every profile (CQ-238), and O-34 for a stop that is not retryable, inactive under the `parity` profile (register row DV-114). Both are data of the table evaluator of feature 100 (annex X §X.3); the choice of a row is a literal.
- **Rationale**: five of the refusals of the baseline cannot occur inside a living root (R15v B-1), and the stop reason is now read from a typed record and no longer matched by string (DV-028). The order of table 1 is observable output (B-2776), so it is data with an id per row.
- **Alternatives**: one table for both (rejected: the signals differ, and the parity profile needs the decisions of table 1 unchanged); to exempt table 1 from F100-FR-163 (rejected by the repair worklist: it changes a contract of feature 100 and leaves the relaunch of a blocked run in place for a consumer who sets `relaunch.owner: supervise`); a table per stage kind (rejected: the stage kind decides only the signal `retryable`).
- **Links**: `spec.md` §R.6; `contracts/relaunch-observe.table.json`, `contracts/relaunch-root.table.json`.

### D-2 A crash is relaunched whatever the stage lists

- **Decision**: row R-23 relaunches a crashed engine within the budget, and the rows R-14 to R-16 apply only when the cause is not `crash`.
- **Rationale**: a crash has no stop reason and no exit code that a stage would list; the baseline refuses it (`child-exit-not-retryable`). R15v B-1 (2) calls this new behaviour with no register row; DV-074 covers the second table.
- **Alternatives**: require the stage to list the crash exit codes (rejected: a signal has none; the run would stop for a cause that the consumer can do nothing about).

### D-3 The relaunch window is the deadline of the budget

- **Decision**: a held relaunch waits until the hold is lifted or the deadline that was fixed at the first launch passes; then the run ends `failed` with `budget-deadline-exceeded`.
- **Rationale**: annex E §E.2 T12 names "the relaunch window" and no source defines it; the deadline is the one bound the baseline already has (B-2766). Reported as CQ-048.
- **Alternatives**: a separate configurable hold time (rejected: a new switch, so a new row of the profile, for a case that has no as-is behaviour).

### D-4 Digest and labelled lines from one line table

- **Decision**: one data file lists every line with its label, form, hue, stream and whether default output prints it. The digest is built from the events of the run.
- **Rationale**: two output modes must not drift (DV-033); R11 T-11 says the digest is never composed by a model.
- **Alternatives**: format strings in code (rejected: the parity test would then compare code with code).

### D-5 Terse output in bytes

- **Decision**: 420 bytes per cycle, 700 for the digest and 8,400 for a whole run, from the budgets of ruling 65 at 2.8 bytes per token.
- **Rationale**: the build measures bytes (F100-FR-187). The budget for a whole run holds only when the root relaunches, because then the host does not watch (R15v B-2).
- **Alternatives**: measure tokens (rejected: no tokenizer in the build).

### D-6 A terminal for a `specstride` stage without a native module

- **Decision**: where colour is on and standard output is not a terminal, run the child under `script(1)`; where colour is off, use a pipe.
- **Rationale**: Node ships no pseudo-terminal, and `node-pty` compiles at install (Language Ledger note in `architecture.md` section 15). Feature 141 chose the same tool for its own terminal (F141 plan D-9).
- **Alternatives**: `node-pty` (rejected: native module). Colour always off for stage children (rejected: changes the compared bytes of a fixture that tests colour, N-21).
- **Degrade path**: the tool is a platform tool outside npm and is optional. Where it is absent or fails to start, the child runs through the pipe as with colour off, and the run goes on (F123-FR-011). A doctor check that is not launch-blocking probes it (F123-FR-044). The model is the plan of feature 122 for `ps` and `sysctl`.
- **Unverified**: the flags of `script(1)` differ between Linux and macOS; the check is FX-35 on a macOS runner.

### D-7 Where the code lives

- **Decision**: `@specstride/pipeline` (L5) holds the executor, the tables and the supervisor library; the command wiring is in `@specstride/cli` (L6).
- **Rationale**: `package-graph.json` names `pipeline` as the L5 package of 107 and 123 and forbids it to import `runtime` (122), so the detach strategy is passed in as a port.

### D-8 The relaunch by the root re-enters the pipeline entry

- **Decision**: a relaunch by the root is a second pass over preflight and the stage loop, under a new launch id, with the completed stages skipped by the rule of F123-FR-009.
- **Rationale**: at the baseline a relaunch re-invokes the launcher, which re-runs preflight and resumes from its state record (B-2767 and `runtime.py`). The port keeps the same observable sequence, which is what FX-36 compares.

### D-9 The retrospective is not here

- **Decision**: `supervise retro` and its lines belong to feature 106; this feature lists the label `[MOL-RETRO]` in no requirement.
- **Rationale**: `traceability-items.tsv` assigns B-2678, B-2691 to B-2693, B-2735 and B-2781 to B-2783 to 106.

## Open questions carried

The questions CQ-046 to CQ-053 of the queue, and CQ-192, as `spec.md` lists them under "Assumptions". Two readings of 2026-09-30 have no queue number yet: CQ-222 (which process emits `launch.checked`) and CQ-223 (when `[SPECSTRIDE-DIGEST]` is left out). None blocks the plan.
