# Quickstart: validating feature 122

How to show that the feature works. Every scenario uses stub processes; none calls a model,
except the paid cases of the spike, which are run by a person and logged. Details of records are
in [data-model.md](data-model.md) and in feature 100, annex B.

## Prerequisites

| Need | Why |
|---|---|
| Node.js 22 or later; `npm install` at the root of the repository | The product and its tests |
| `ps` on the search path; on macOS also `sysctl` | The identity check and the search for survivors |
| A scratch control root: set the key of the control root to an empty directory | No test touches the real state directory |
| For parity tests: the reference trees of feature 141 | FX-11, FX-13, FX-35, FX-36 |
| For the spike: a live host session | Otherwise every case is a skip with its reason |

## Scenarios

| # | Scenario | Run | Expected | Proves |
|---|---|---|---|---|
| 1 | The spike (paid, run by a person, logged; no test waits for it) | `node spikes/122-detach/run.js --cases all` inside the host's shell tool, then end the session | One result per case in `spikes/122-detach/results/`: `survived`, `ended` or `skipped` with a reason | F122-FR-040, F122-SC-001 |
| 2 | Detached start | `npm test -- --test-name-pattern "EP-17"` | The child lives after the parent ended, by exit and by a signal; the lease is valid; the sample strategy passes | F122-FR-001 to F122-FR-003 |
| 3 | Handshake | `npm test -- --test-name-pattern "CT-122-(5|6|7)"` | `started` exit 0 with the line `[SPECSTRIDE-LAUNCH]`; a refusal with the line `[SPECSTRIDE-REFUSE]`; two racing launches give one `started` and one `attached`; an abandoned record is closed by the next launch | F122-FR-005 to F122-FR-007, F122-SC-007 |
| 4 | Contention | `npm run test:contention -w @specstride/runtime` | 300 of 300 rounds with exactly one winner, for `acquire` and for `reclaim` | F122-FR-011, F122-FR-015, F122-SC-002 |
| 5 | Provider conformance | `npm test -- --test-name-pattern "EP-13"` | Owner killed; owner dead with a live child; reused pid after a changed boot identity; foreign host name; the sample provider passes | F122-FR-010, F122-FR-013, F122-FR-016, F122-FR-017 |
| 6 | Second run refused | `npm run parity -- --fixture FX-11` | `equal` on `second-run-refused` and `lock-form`; `waived (DV-022)` on `stale-lock` and `orphaned-child` | F122-FR-011 to F122-FR-014, F122-SC-006 |
| 7 | Engine killed | `npm run test:crash -w @specstride/runtime` | With the root alive: the stub harness process is gone before the next engine start. With the root dead: the survivor is reported, then ended by `resume` | F122-FR-026, F122-FR-027, F122-SC-004 |
| 8 | Wrong process | `npm test -- --test-name-pattern "CT-122-25"` | With a planted entry: 0 signals, end cause `identity-mismatch` | F122-FR-025, F122-SC-005 |
| 9 | Inbox | `npm test -- --test-name-pattern "CT-122-(29|30)"` | Known types are acted on at a boundary; unknown and malformed ones are ignored and reported; a stop request written while no run is active stops the next engine start at its first boundary | F122-FR-029, F122-FR-030 |
| 10 | Moved tree | Approve two phases with stubs; move the tree; `specstride launch`; then `specstride state adopt --feature <slug> --from <old path>`; `specstride launch` | First launch refused with `unadopted-approvals`, the three commands named; after `adopt` the run continues at phase 3 | F122-FR-035, F122-FR-037, F122-SC-003 |
| 11 | Export and import | `specstride state export`, change one byte of the archive, `specstride state import` | Exit 1, nothing written; the unchanged archive imports with exit 0 | F122-FR-033, F122-FR-034 |
| 12 | Marker | Start a run; remove `workspace:active`; wait one heartbeat | The marker is back; an integrity event exists | F122-FR-038 |
| 13 | Layout version | `npm test -- --test-name-pattern "CT-122-43"` | The first launch writes `workspace:layout-version`; a file of another major refuses the launch; a missing file is written again | F122-FR-043 |

## What stays unverified after these scenarios

| Subject | Until |
|---|---|
| Every macOS result | A macOS runner exists |
| Detach survival on a host where the spike was skipped | The spike has run there |
| Path length limits of the liveness endpoint | The measurement task has run on both platforms |
