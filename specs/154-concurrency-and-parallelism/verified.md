# Verified — 154-concurrency-and-parallelism

Phase 18 (polish — fixtures, trials, register rows, T166–T172), recorded
2026-11-27. Every number below is the output of a command actually run on this
checkout: `node scripts/trial-all.mjs` (the loop of T169, one run of
`scripts/trial.mjs --switch <name> --fixtures
specs/154-concurrency-and-parallelism/contracts/fixtures-154.json` per switch),
with each record under `trials/`. No number here is a forecast; nothing in this
file turns a switch on (F154-FR-001, -008, -018).

## The trial, per switch (F154-FR-018, -019; CQ-154-15 A)

Each trial ran the fixture set of `contracts/fixtures-154.json` twice through
the stub engine (a stub proposer and a stub critic; no model is called) — once
with every switch off, then with only the named switch on — and read the three
pass-mark rows: TRI-1 (no breach invariant of F142-FR-071 fails), TRI-2 (every
rule test passes), TRI-3 (the exit codes, stop reasons and run states with the
switch on are subsets of those with it off, F154-SC-001). The first case of
every trial is the recorded read of feature 153's 28 groups: kept 0 of 28 on
record (F154-FR-019). The pass mark comes from `passMarkOf` over the pure
table (`trial-pass-mark-table.json`); every switch below marks **pass**
(`TRI-pass`).

| Switch | Record | TRI-1 | TRI-2 | TRI-3 | Pass mark | Rows (switch on) | Off until ruled |
|---|---|---|---|---|---|---|---|
| `loop.parallel.noRepeat` | `trials/loop.parallel.noRepeat.json` | ok | ok | ok | pass (`TRI-pass`) | 0 kept of 0 groups; 2 passes, 2 cycles, 0 tokens in either arm | yes |
| `loop.parallel.mergeBaseline` | `trials/loop.parallel.mergeBaseline.json` | ok | ok | ok | pass (`TRI-pass`) | 0 kept of 0 groups; 2 passes, 2 cycles, 0 tokens in either arm | yes |
| `loop.parallel.groupUnits` | `trials/loop.parallel.groupUnits.json` | ok | ok | ok | pass (`TRI-pass`) | 0 kept of 0 groups; 2 passes, 2 cycles, 0 tokens in either arm | yes |
| `loop.parallel.groupCheck` | `trials/loop.parallel.groupCheck.json` | ok | ok | ok | pass (`TRI-pass`) | 0 kept of 0 groups; 2 passes, 2 cycles, 0 tokens in either arm | yes |
| `host.limits` | `trials/host.limits.json` | ok | ok | ok | pass (`TRI-pass`) | 0 kept of 0 groups; 2 passes, 2 cycles, 0 tokens in either arm | yes |
| `pipeline.stageGroups` | `trials/pipeline.stageGroups.json` | ok | ok | ok | pass (`TRI-pass`) | 0 kept of 0 groups; 2 passes, 2 cycles, 0 tokens in either arm | yes |
| `loop.phases.parallel` | `trials/loop.phases.parallel.json` | ok | ok | ok | pass (`TRI-pass`) | 0 kept of 0 groups; 2 passes, 2 cycles, 0 tokens in either arm | yes |
| `loop.speculate` | `trials/loop.speculate.json` | ok | ok | ok | pass (`TRI-pass`) | 0 kept of 0 groups; 2 passes, 2 cycles, 0 tokens in either arm | yes |

TRI-3 detail, identical for all eight records:
`{"exitCodesAreSubset":true,"stopReasonsAreSubset":true,"runStatesAreSubset":true}`.

The rows above carry NO pass mark inside the records themselves (F154-FR-018):
`arms[].rowsWithoutPassMark` in each record is the read the owner makes. The
trial proves safety, not a default: no exit code, stop reason or run state
outside the closed sets, no breach invariant failed.

## What the records do not show

The stub fixture of `scripts/trial.mjs` exercises FX-154-PLAN and
FX-154-GROUPS; the records name the fixtures the trial could not run in this
tree (FX-154-SLOTS, FX-154-STAGES, FX-154-PHASES, FX-154-SPEC, FX-154-DOOR) as
`not exercised`, and no row above stands in for them. The groups rows read 0
of 0 because no group closes on the stub fixture — the group counts of record
stay 153's frozen read (kept 0 of 28), never a number from this run.

## Status of every switch

Every one of the eight new switches is **off by default, off under `parity`,
and off until the owner reads its record and writes the register row**
(F154-FR-001; CQ-154-15 A). `loop.parallel.units` is feature 142's own switch
and is not a switch of this feature; its record
(`trials/loop.parallel.units.json`, recorded with phase 17) stands beside
these eight.
