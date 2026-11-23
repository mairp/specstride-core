# Research: Run control (feature 102)

Summaries of decisions, with links to the reports in `docs/ecosystem/research/` and to the rulings. Nothing here is new research.

| # | Decision | Rationale | Alternatives | Source |
|---|---|---|---|---|
| D-1 | `resume` exits 5 (lock held), 3 (nothing to resume), 3 (a source changed); the oracle maps the as-is 1 | 1 means internal error elsewhere; 5 already means lock held | Keep 1 and 1 | Ruling K2; DV-021; `consolidation.md` C-03 |
| D-2 | Order of refusals: nothing to resume, lock held, changed source. Before them comes the state check of annex G §G.4, which exits 1 on a workspace without state | The baseline checks the state directory first (B-1482), then the settings before the lock; Lisa lists the hash last | Lock first; exit 3 for a workspace without state | `specstride:252` (B-1482); `specstride:583-589` (B-1580); 002 FR-016; CQ-184 |
| D-3 | A changed source is refused with exit 3 for the command and read as `blocked-on-human` for the run | K2 gives the code, K3 the state and signal | Two different codes | `feature-briefs.md` D.8 row 1; ruling K3 |
| D-4 | The CLI records the refusal in the launch record; readers derive the state; the next event writer writes the synthesized event | The CLI writes no run state or event (LR-3, LR-4) | The CLI writes the event | CQ-021; `architecture.md` LR-3, LR-4 |
| D-5 | The hash compared for the task list ignores checkboxes | The runtime ticks tasks after approval | Compare the full text | R28; `feature-briefs.md` D.8 row 2 |
| D-6 | The flag on `resume` is `--accept-source-change` | Ruling P12 left the name open | Another literal | CQ-017; F100-FR-173 |
| D-7 | Accepting a change derives plan and manifest again, records new hashes, keeps counts and delivered evidence, and tells every critic as a fact | An edit must not throw away 44 h of work, and the critic must know | Always a new run | Rulings 29, K3, P12; R23v IR-54; annex D §D.7 |
| D-8 | Counts continue across resume and relaunch; the reset flag is command-line only, recorded, never replayed | Otherwise the bound on passes holds per launch only; a replayed flag would reset on every resume; a flag in project configuration would be set by the proposer | Restart as the baselines do | Ruling 9; R23v V-16, IR-50; C-14 |
| D-9 | Output: `stop` prints one default line; a refusal prints the failing item and its fix. Compatibility output reproduces the as-is lines. Starting share of the token budget: under 300 bytes for each command | Annex G §G.2; budgets of §G.5 are for the host skills that call these commands | Longer explanatory text | Ruling 68; F100-FR-187 |
| D-10 | Snapshot with pinned and tunable classes; pinned ranks below flags and above the environment, tunable below the environment | The remedy text the engine prints must work; identity must stay stable | Re-resolve everything on resume | R16 F5.5, F7; DV-024; ruling 10 |
| D-11 | A failed write of the snapshot is a launch error; a refused launch writes none | The baseline ignores the failure and overwrites the file before validation | Ignore as today | R16 F5.5; B-0260 |
| D-12 | `stop --now` signals only entries of class `owned` after pid, start time and run token match; TERM only | A pid file can point at an unrelated process | Signal every recorded pid | R11 T-26; R15v P-2; F100-FR-064; B-1566 |
| D-13 | `stop` never ends an `adoptable` job; `--jobs` is a separate request | A yielded job outlives its pass by design | `--now` ends jobs | R15 A-7.3; R2v |
| D-14 | `resume` reaches the lock through `probe` and `reclaim`; owner dead with a live owned group refuses and names survivors | Reclaim belongs to feature 122; survivors are a hazard | Kill survivors | R2v; F100-FR-158; EP-13 |
| D-15 | `resume` verifies signed approval records; a bare marker is not approved | The proposer can write a marker | Trust presence | Ruling 33; DP-010; DV-029 |
| D-16 | Stop with no run active still writes the request; the engine removes it when honoured | As the baseline (D-28, D-29 of R19) | Refuse | B-1578; SL-5 |
| D-17 | A `finished` run has nothing to resume (exit 3) | The state machine has no transition out of `finished` | Run the release verification again | Annex E §E.2 T17; CQ-073 |
| D-18 | The route of a continued run is the route of its last launch | A host resumes through the runtime root; the CLI in a terminal in the foreground | Always detach | R15 A-7.3; annex E §E.4; CQ-072 |

## Baseline facts read

| Fact | Where |
|---|---|
| `stop` touches one flag per workdir, warns if the lock is free, and `--now` reads the pid file and signals the tree with TERM only | `specstride:551-575`, `:277-282` at `9cab15d` |
| `resume` sources the saved settings, checks the file before the lock, and appends extra arguments last | `specstride:577-628` |
| The saved settings are written at every run start, before validation, and a failure is ignored | `orchestrator.sh:640-685` |
| The engine tests the flag at the top of each attempt and after the pass; exit 6 wins over evidence | `orchestrator.sh:1768-1773`, `:1881-1884` |

## Open items

`CQ-072` to `CQ-079` and `CQ-184` in `spec.md`, "Assumptions". No spike, capture or paid probe is inherited; the only `unverified` facts are the macOS process identity (F100-FR-062) and the write of the inbox from the host's shell (feature 122's spike).

## After the cross-feature review (2026-09-30)

| # | Decision | Rationale | Alternatives | Source |
|---|---|---|---|---|
| D-19 | An accepted change is the event `source.change_accepted`, one for each file, written by the writer of the event file | The writer drops an event without a type of the catalogue; the CLI writes no event | Carry the fact in `integrity.noted` with a `kind` | W-111-02; annex X §X.1; F100-FR-199 |
| D-20 | `unblocked` closes `blocked` when `resume` leaves `blocked-on-human`; `by` is `operator` | Every event that opens has one that closes (F100-FR-200); the request has no field that says who asked | No closing event | W-X-24; CQ-078 |
| D-21 | The engine-side module reads the inbox and the ledger through the kernel | The core packages may not import `node:fs` | A port of its own | F100-FR-012; CQ-185 |
| D-22 | The CLI writes `acceptedChanges` into the snapshot at `resume`; the engine reads it, emits the event and supplies the fact | The CLI owns the snapshot (F102-FR-025); the core writes only events and the ledger | The engine writes the snapshot | Analysis I1; F100-FR-012; annex B §B.2 |
| D-23 | The as-is engine lines of a stop are rendered by the presenter from the compatibility projection; the stop event carries `foundAt` | Annex G §G.3 gives the presenter the projection as its input in compatibility output; a second text path in the engine would break Principle XI | The engine prints the lines | Analysis I2; annex G §G.3 |
| D-24 | One continuation module of the CLI serves `launch`, `run` and `resume` | The three commands must not drift; `launch` is not this feature's file | Continuation in `resume.ts` only | Analysis G1; annex G §G.1, §G.3 |
