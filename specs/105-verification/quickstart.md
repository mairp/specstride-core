# Quickstart: validating feature 105

Prerequisites: the workspace built; the stubs and fixture families of feature 141; no network.
Commands are given in words where the test runner's spelling belongs to the build.

| # | Scenario | How | Expected |
|---|---|---|---|
| 1 | The three modes | Run the parity tests of FX-14 | 0 results `different`; in `mode-required-fail` the critic transcript has no call for the failed phase attempt |
| 2 | Invalid mode | `specstride run --verification sometimes` on a fixture | Exit 3; the as-is message |
| 3 | Release verification | Run the parity tests of FX-15 | Exit 2 and stop reason `release_verification` in `release-verification-fails` |
| 4 | Staged commands | Run the parity tests of FX-16 | `pre-staged-reused` shows `reused: true`; `pre-staged-stale` executes the command |
| 5 | The command `verify` | `specstride verify create …`, `validate`, `run --phase 1`, `run --phase release` on a fixture | Codes 0, 0, 0 or 10, 0 or 10; `valid` printed by `validate` |
| 6 | Conformance of the plan source | Run the conformance suite of EP-07 on the three sources and the sample | Declared commands appear with provenance; a conflict is a blocker; no declaration gives an empty manifest |
| 7 | Staleness | Change the task list during a phase attempt, once with the `parity` profile and once without | With the profile, in the mode `plan`, the critic call ends with result code 3; without it no critic call is refused |
| 8 | Reads and writes from repository text | Run CT-105-116 on a verification-commands document that gives `reads` and `writes` | A finding names the command; the manifest entry has neither field; the command runs alone |
| 9 | Mode in the snapshot | Launch a fixture in the mode `plan` and read `run:<runId>:snapshot` | The key `verification.mode` is `plan`; the run record has no field of this feature |
| 10 | No reuse with a loop layer engaged | Run CT-105-133: a staged result that the reuse rules would take over, once without a declared unit of work and once with one | Without a unit the result shows `reused: true`; with one the verification gate executes the command |
| 11 | The stage `pre` and the hashes of the plan | Run PT-105-C-080-declared-commands and PT-105-C-080-ids-and-hashes on FX-16 and FX-14 | A command declared `pre` is stored and staged as `prestage`; `contentHash` and the source hash equal the baseline's |

Details of records: [data-model.md](data-model.md). Interfaces: [contracts/README.md](contracts/README.md).
