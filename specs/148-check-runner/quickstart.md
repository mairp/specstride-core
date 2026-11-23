# Quickstart: validating feature 148

Prerequisites: the workspace built; the scripted commands of `tests/fixtures/148/`; no network.

| # | Scenario | How | Expected |
|---|---|---|---|
| 1 | Conformance of the runner | Run the conformance suite of EP-05 on the kind `command` and on the sample runner | Pass, fail at step n, slow, never ending and very large output give the documented results |
| 2 | Parity of the four carried items | Run `PT-148-C-080-command-run` and `PT-148-C-080-timeout-and-start-error` | 0 results `different` |
| 3 | No credential | Plant provider variables; run a command that prints its environment | None is printed outside the `parity` profile; all are printed under it |
| 4 | Taint | A command that changes a protected file while it runs | `tainted`, reason `changed-during-check`; not a pass |
| 5 | Integrity | Change one byte of the stored manifest between two checks; replace a pinned executable | The check does not run and `integrity.noted` is written (`kind` `manifest-hash`); `tainted` with `pin-mismatch` |
| 6 | Concurrent commands | Run the own tests CT-148-201 to CT-148-208 with `verification.parallelism` 1 and 3 | Equal results, signatures and fact contributions; a taint of a batch writes `check.parallelism_lowered`; an entry without a declaration in the manifest runs alone |
| 7 | Step runner | A command of 40 steps whose step 35 fails; resume from it | Stops at step 35; the resumed execution is `partial` |

Details of records: [data-model.md](data-model.md). Data: [contracts/README.md](contracts/README.md).
