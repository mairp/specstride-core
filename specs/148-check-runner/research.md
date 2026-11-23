# Research: Check runner (feature 148)

Phase 0 of the plan. The research is in `docs/ecosystem/research/`; this file records the
decisions of this feature. No item of the Technical Context is open.

| # | Decision | Rationale | Alternatives considered | Source |
|---|---|---|---|---|
| D-1 | Extract the executor of Lisa's verification package as source; bring it to the behaviour of the Specstride baseline first | Ruling 12. It already runs every command of a set | Write new: more work for the same behaviour | R1 (B6), R1v |
| D-2 | One runner for every check | A result must mean the same everywhere | A runner per caller | R27 D1.4; feature 100 annex C §C.8 |
| D-3 | Batch formation is a pure function: greedy, in manifest order, prefixes compared with a path boundary | Deterministic, testable without running anything (Principle XX) | Packing for the shortest time: the result would depend on durations | R29 PU-74, PU-11 |
| D-4 | Commands declare reads as well as writes; undeclared means serial | Ruling P11 | Writes only: broken by R29v V-04 | R29v V-04, PU-101 |
| D-5 | A command that failed in a batch of more than one is executed once more alone; both results are stated | Tells a real failure from one a neighbour caused | Trust the batch result | R29v PU-101; R23 IR-14 |
| D-6 | After a taint in a batch the parallelism is 1 for the rest of the logical run | The change cannot be attributed to one command | Exclude only that batch | R29 PU-76 |
| D-7 | Conditions are fields beside the exit result | R23v IR-40 | One status column | R23v V-07 |
| D-8 | The environment of a command is an allow-list outside the `parity` profile | Threat T-21 | Pass the environment of the process | R11 T-21; R23 IR-10; DV-113 |
| D-9 | Output is cut to the first 64000 characters per stream; nothing beyond is kept | Parity; threat T-25 | Keep all output in a file | B-1121; R29 PU-75 |
| D-10 | Process groups through the spawn options Node ships; a group is ended by a signal to the negative process id | No native module | A helper binary | R2, R17 |
| D-11 | Stopping at a first failure exists between the steps of one command only | Ruling 51 | A gate that stops early: withdrawn | R23v IR-03 as amended |
| D-12 | The lowered parallelism is kept in the field `verificationParallelism` of the run record. Where the engine is a child and does not write the run record, it puts the value into its terminal record, which the runtime root reads on every exit path and copies (proposal P2 of `analyze-report.md`); only with a synthesized terminal record is the value derived from the event `check.parallelism_lowered` | Feature 100, annex E §E.2 has the field; the runtime root writes the record | A file of its own: a logical name that does not exist | CQ-180 |
| D-13 | Declared reads and writes are taken from the frozen check manifest only, never from repository text | Ruling P11; a declaration from repository text could widen what runs side by side | Read them from the verification-commands document | CQ-190 |
| D-14 | The result is a returned value; the stored record of an inner check is `specstride.check-result/1` of feature 116, with a stated mapping | One owner per stored record (feature 100, annex B §B.20) | A second field list for the same logical name | W-148-01 |

## What is `unverified`

Recorded by **T063 and T061** of phase 8 on **2026-10-02**. The status of each
item, with the date it was last read and the version it was read at, is below;
the fuller record, with the phrase of every macOS statement of this feature and
the file it stands in, is `verification-record.md`.

| Item | Check that would verify it | Status | Date | Version |
|---|---|---|---|---|
| A signal to a process group ends all children of a command on macOS | The conformance suite of EP-05 on a macOS runner | `unverified` | 2026-10-02 | not run on any macOS; the Linux run it was last read beside: Node.js v22.23.2 on Linux `7.0.14-15-pve` (x64), `@specstride` 0.0.0, constitution v3.0.2 |
| Whether Lisa's verification tests pass | Run them once after extraction (R1 O5) | `unverified` | 2026-10-02 | Lisa at `363e6a3`, read-only; the extraction is pinned by source sha256 in `packages/check-runner/EXTRACTED.md` and characterized by CT-148-2 |

### The macOS fact, in full

**The fact.** `research.md` D-10 decides that a process group is ended by a
signal to the negative process id, through the spawn options Node ships. That a
signal to the group ends **all children** of a command is verified on Linux and
is `unverified` on macOS.

**Why it is `unverified`, and not merely untested.** The check that would
verify it is the conformance suite of EP-05 run on a macOS runner. **No macOS
runner exists in this checkout**, and a macOS task is out of band by the
owner's ruling of 2026-09-30: it is never run here and never faked. The
hermetic half was done instead, on Linux, and its result is in
`verification-record.md`.

**What was verified, and where.** On **2026-10-02**, on **Linux
`7.0.14-15-pve` (x64), Node.js v22.23.2**: the conformance suite of EP-05
(`packages/testkit/src/conformance/EP-05/`) passes, and the end of a process
group after a time limit is read from the operating system itself — the time
from the result of a command ended by its limit to `kill(-group, 0)` reporting
`ESRCH` is a median of **0.12 ms** against the starting value of 5 s
(`packages/check-runner/README.md`, task T062).

**Where the statement stands in the specification.** F148-FR-002 of `spec.md`
carries it as its own `status:` line — *"unverified (check: on macOS a command
started in a process group of its own is ended with all its children by one
signal to the group; verified-on: —; pin: the macOS runner of the release
build)"*. That line, and every other macOS statement of this feature, is held
to this record by `tests/release/148/verification-record.test.ts`: a statement
that stopped being `unverified` without a macOS run would fail the build.

## Inherited work

No spike, no fixture capture and no paid probe.
