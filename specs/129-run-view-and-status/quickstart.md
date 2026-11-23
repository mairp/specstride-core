# Quickstart: see each behaviour on the fixtures

Every command below is a test task of `tasks.md` and runs with the stubs and the fake clock of feature 141 and the testkit. No paid call.

| Behaviour | How to see it |
|---|---|
| A view of a finished run | Project the primary event file of FX-01 `three-phases`; all lanes are `approved`; the state is `finished` |
| A rejected phase attempt | FX-02 `reject-approve`; the reject count and the lane history |
| A run that ended at the reject limit | FX-03 `reject-limit`; state `failed`, lane `failed` for the current phase |
| A stopped run | FX-12 `stop-between-passes`; state `stopped`, lane `blocked` |
| Resume and counts | FX-13 `resume-after-reject-limit`; counts carried in the view |
| A lock held by a live run | FX-11 `second-run-refused`; liveness `alive` |
| A yield | FX-22 `predicate-file-exists`; the lane `verifying` or `proposing` while the wait is open |
| A wall budget | FX-23 `wall-budget` |
| The data behind `status` | FX-28 `status-<case>`; the compatibility lines are compared by feature 119; this feature checks that each fact is in the view |
| A dead run | A hand-made log and a lease probe answering `stale-owner-dead`; `status` prints `st=dead` |
| A torn line | A hand-made log whose last line is cut; the view is equal to the view without it |
| Prefix property | `tests/characterization/129/prefix.test.ts` over every log |
| Silence | `tests/characterization/129/wait-silence.test.ts` with the fake clock: 0 bytes |
| One line on a change | The same test, with one appended rejection: one line, at most 170 bytes |
| Expiry of the precomputed line | `tests/characterization/129/line-expiry.test.ts` with a clock past `validUntil` |
| A sample renderer | `packages/testkit` sample renderer given the JSON and no file handle |
