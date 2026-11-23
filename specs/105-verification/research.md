# Research: Verification (feature 105)

Phase 0 of the plan. The research itself is in `docs/ecosystem/research/`; this file records the
decisions of this feature and links to it. No item of the Technical Context is open. Decision numbers keep their values of before the split of 2026-09-29; the decisions that left are in the research file of the feature that holds the check runner.

| # | Decision | Rationale | Alternatives considered | Source |
|---|---|---|---|---|
| D-1 | Extract the hash, the renderer and discovery of Lisa's verification package as source; write the planner new on the canonical spec model | Ruling 12 (selective extraction). Its planner reads Lisa's own spec model | Port the Python module line by line: more work for the same behaviour. Take Lisa's package whole: its store per spec bundle is deferred | R1 (B6, row `verification`), R1v; brief 105 heading 3 |
| D-2 | The verification gate runs before the critic; the default mode is `required` | Ruling K1; parity with the Specstride baseline | Lisa's order (critic first): superseded by DV-040 | R19 C-01 |
| D-3 | The gate never stops at a failed command; stopping early exists in the step runner only | Ruling 51; the failure signature must be complete | Stop at first failure in the gate: withdrawn by R23v V-18 | R23v IR-03 as amended; R27 D1.4 |
| D-10 | No staleness check at critic start outside the `parity` profile | Ruling K3. The baseline refused a critic call 22 h into a phase attempt | Keep both checks: the late refusal stays possible | R28; DV-082 |
| D-13 | The manifest is written when the loop strategy is not `classic` or when a switch of this feature needs it | The narrowest reading that keeps DV-052 true under the `parity` profile and lets the integrity rules work with the layer off | Always write it: a file with no as-is equivalent under the profile. Only with the layer: rows 7, 31, 33 could not work with the layer off | CQ-153 |
| D-14 | The sub-commands of `verify` keep the names of the baseline | Ruling 26 keeps the exit codes; operators' scripts use the names | New names: a mapping table with no gain | CQ-155 |
| D-17 | A detached command staged before is started by the process primitive of the kernel, not through the check runner and not by `node:child_process` | The package may not start a process by itself (F100-FR-234). The check runner ends a command at its time limit, and a detached command is never ended at its deadline | The check runner with a new start option: a change of the contract of EP-05, reported as a question | W-105-02 |
| D-18 | Declared reads and writes of a command never come from the verification-commands document | The document is repository text; a file of the project could otherwise widen what runs side by side | Accept them and freeze them in the manifest: the other answer of CQ-190 | CQ-190; rulings P11 and 35 |
| D-19 | The loop layer reads the verification mode from the run snapshot | The run record has one writer and no field for the fact | A field of the run record: an amendment of annex E §E.2 that no report asks | W-105-01 |
| D-16 | The toolchains of discovery and the word lists are data files | A further toolchain needs no code | Constants in code | Principle VI; F105-FR-017 |
| D-20 | The hashes and ids of the plan are taken over the text form of the baseline (sorted keys, compact separators, non-ASCII kept, no final line end) with the content hash of a text of the hasher; the manifest uses the canonical record hash | The baseline hashes that text (`lib/verification_plan.py:79-88`, `:1050`); the canonical record hash of annex X §X.5 ends its text with a line end and gives another hash, which the oracle would report as different ("Hash, same class") | Use the canonical record hash for the plan: every plan hash and the source hash differ from the baseline. A second hasher in this package: forbidden by F100-FR-207 | Second analyze run, I1; B-1108; B-1095 |
| D-21 | In the mode `plan` the commands staged before run; only the verification gate executes nothing | The baseline runs the step in both modes (`specstride-lib.sh:571`), and code outranks prose within the baseline | Run nothing in the mode `plan`: a difference with no register row | Second analyze run, I2; B-0375; B-1150 |
| D-22 | With a loop layer engaged the verification gate takes over no staged result; the engine hands the fact in | F100-FR-232 says so and Principle II asks that the full verification gate runs again before the critic; no feature stated it | Leave it to the owner of the check runner: that feature names the reuse rules as this feature's | Second analyze run, I3 |
| D-23 | Every entry of a manifest is inner. The entries are the commands of the phase itself (its suite); the cumulative verification gate reads the manifests of the phases it covers | "The inner set is the manifest" (brief 115; R27 D1.4). Annex D §D.8 says "the commands of the phase", and Principle XIV and F105-SC-001 ask that a phase without commands stays empty, which a cumulative manifest would break | A field `inner` in the verification-commands document: repository text would then choose what the runtime checks between units. A manifest that holds the cumulative commands of the verification gate: a phase without commands of its own would not be empty, and every inner check would run the commands of all earlier phases | Second analyze run, U2 |
| D-24 | The log of a detached command is written by the process itself; the ingress stands where the log is read | The process may outlive the engine, so the engine cannot stand between it and its log; the baseline redirects the streams to the file (`lib/verification_plan.py:1765-1773`). The raw log stays in the control plane and reaches no sink and no prompt unread by the ingress | A pipe through the engine: the process dies or blocks when the engine ends, against B-1127 | Second analyze run, I4 |
| D-25 | A verification gate that cannot run (code 3) is the same rejection as a failed command | The baseline treats every exit other than 0 so (`orchestrator.sh:1988-1991`; B-0320) | Halt the run on a code 3 at the verification gate: a difference with no register row | Second analyze run, U3 |

## What is `unverified`

| Item | Check that would verify it | Status | Date | Version |
|---|---|---|---|---|
| A process started in a session of its own survives the end of the engine on macOS | The fixture `long-job-running` of FX-16 on a macOS runner, port side | `unverified` | 2026-10-03 | `@specstride` 0.0.0, constitution v3.0.2, Node.js v22.23.2; `verified-on: —` |
| Whether Lisa's verification tests pass | Run them once after extraction (R1 O5) | `unverified` | 2026-10-03 | Lisa read at `363e6a3`, read-only (`STAGE-B-RULES.md`) |
| Who records the exit code of a detached command whose engine has ended | The baseline starts a wrapper in the same session that writes the status record (`lib/verification_plan.py`, `_DETACHED_SHIM`). Whether the process primitive of F100-FR-234 can do the same is reported to feature 100 (analyze report, second run) | `unverified` | 2026-10-03 | reported to feature 100; no amendment of annex A yet |

The first row is the one task **T142** names. Its macOS half is **out of band** by the
owner's ruling of 2026-09-30: no macOS runner exists in this checkout, so it is never run
here and never faked, and the statement stays `unverified` with `verified-on: —`. The
hermetic half was run on Linux on 2026-10-03 and is recorded, with the counts of the run and
every macOS statement of this feature, in
[verification-record.md](verification-record.md).

## Inherited work

The brief names no spike, no fixture capture and no paid probe for this feature. It names
characterization tests of the extracted Lisa parts, which are tasks.
