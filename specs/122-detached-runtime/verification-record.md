# Verification record: Detached runtime (feature 122)

What this feature has verified and what it has not, with the reason for each gap. The record exists
because the owner's out-of-band ruling of 2026-09-30 says that a paid, live, person-run or macOS
step is never run and never faked by an unattended run: the hermetic part is done on Linux, the rest
is recorded here as `unverified` with its reason, and a phase whose only open work is of that kind
counts as complete.

A statement is `verified-local` only where this lane ran it and read the answer back. `unverified`
is not a failure and not a guess — it is the absence of a measurement, named.

**Target platform** (plan.md): Linux and macOS. Every macOS statement is `unverified` until a macOS
runner has passed (ruling 67).

## Measured on Linux

| Id | Statement | Status | Measured on | Evidence |
|---|---|---|---|---|
| VR-122-01 | The path length limit of a local stream socket on Linux is **108 bytes**: a socket path of up to and including 108 bytes is created where it was asked for. | `verified-local` | 2026-10-02 | `packages/runtime/test/characterization/socket-path-limit.test.ts`, test `CT-122-21 — the path length limit of a local stream socket, measured`; recorded in `research.md` under D-3 |
| VR-122-02 | Past that limit the failure is **silent**: `listen` and `connect` both report success, no socket exists at the path asked for, and the path is truncated to 108 bytes and bound there. Two paths over the limit that agree on their first 108 bytes are one endpoint (`EADDRINUSE`), and a connection to either reaches the first owner. | `verified-local` | 2026-10-02 | same file, tests `… the failure is SILENT …` and `… two paths over the limit that share a prefix are ONE endpoint` |
| VR-122-03 | The 100-byte guard of D-3 sits at or below the measured limit, and a path of exactly 100 bytes binds. The guard is therefore sound on Linux with 8 bytes of margin. | `verified-local` | 2026-10-02 | same file, test `… the 100-byte guard of D-3 sits at or below the measured limit` |
| VR-122-08 | T070, the quickstart scenarios of `specs/122-detached-runtime/quickstart.md` that run on Linux without a live host session, AND the measurements against the **Performance Goals** of `plan.md`. Scenarios 2, 3, 4, 5, 7, 8, 9 and 13 were run on 2026-10-04 and all passed: EP-13 and EP-17 conformance, the handshake CT-122-(5\|6\|7), contention 300 of 300 rounds with exactly one winner (`npm run test:contention -w @specstride/runtime`, test duration **4.91 s**), wrong-process CT-122-25, inbox CT-122-(29\|30), crash CT `npm run test:crash -w @specstride/runtime` (**1.97 s**), layout version CT-122-43. Measured: **probe** of a free workspace 0.46 ms and of a held lock 1.1–6.7 ms (< 50 ms); **acquire** without contention 4.2 ms (< 100 ms); **contention** 300 rounds × 8 contenders in 4.91 s (< 5 min); **launch** (the launch record to the outcome `started`, through `startTheRoot`) 2.9–3.2 ms warm, 88.6 ms on the first, cold sample (< 2 s). Every goal of `plan.md` line 46 holds with a wide margin. | `verified-local` | 2026-10-04 | This lane's runs on this machine; the commands cited above are the quickstart's own commands. Scenarios 1 (the spike) and 10–12 (CLI end-to-end and marker) are covered by their test counterparts; scenario 1 stays `unverified` as VR-122-07. |

## `unverified`, with the reason

| Id | Statement | Status | Reason | Owed by |
|---|---|---|---|---|
| VR-122-04 | The path length limit of a local stream socket on **macOS**. The figure of about 104 bytes in R15v B-9 is general knowledge, not a measurement; this lane did not measure it and does not record it as measured. | `unverified` | **No macOS machine exists in this lane.** The macOS case of `packages/runtime/test/characterization/socket-path-limit.test.ts` is a skip carrying exactly this reason; it performs the same measurement when it ever runs on a macOS machine. (T009; the owner's out-of-band ruling of 2026-09-30.) | The owner, on a macOS runner |
| VR-122-05 | The macOS branch of the process table of the kernel primitive: the start time of a process from `ps` under the locale `C`, and the run token read from the environment shown by `ps`. | `unverified` | **No macOS machine exists in this lane.** Carried in the code as `MACOS_IS_UNVERIFIED` and `MACOS_UNVERIFIED_REASON` in `packages/kernel/src/proc/table.ts`, and as a skip with its reason in `packages/kernel/test/proc.test.ts`. Research D-6 and D-8 already mark every macOS value `unverified`; D-8 further records that reading the environment of another process on macOS may be refused by the system. (T075, T076.) | The owner, on a macOS runner |
| VR-122-06 | The macOS branch of the platform readers of the runtime: boot identity from `sysctl`, host name, the null pid namespace, and the environment of a process of the same user. | `unverified` | **No macOS machine exists in this lane.** Carried in the code as `MACOS_VERIFICATION` in `packages/runtime/src/procs/platform.ts` and asserted to be `unverified` by `packages/runtime/test/unit/platform.test.ts`. The Linux branch is exercised against recorded fixtures AND against this live machine; the macOS branch is exercised against recorded `ps` fixtures only, which proves the parsing and not the platform. (T010, T011.) | The owner, on a macOS runner |
| VR-122-07 | The sixteen cases of the detach spike, eight on Linux and eight on macOS. | `unverified` | **Paid**, and the macOS half also has no machine. Every case needs a live host session, which is a model turn of the host; the owner's ruling forbids an unattended run to start one. All sixteen are recorded `skipped` with their reason in `spikes/122-detach/results/`, logged in `spikes/122-detach/results/LOG.md`, and carried as facts SF-122-01 to SF-122-03 in `packages/runtime/src/doctor/spike-facts.json`. No requirement of the product depends on the outcome (F122-FR-041). (T002, T003, phase 1.) | The owner, in a live host session |
| VR-122-09 | T071, the macOS part of the later platform work of phase 9: every statement of phase 9 that names macOS — the macOS results of the quickstart scenarios, the macOS half of any phase-9 measurement, and the macOS branch of the layout version work, which is platform-independent code whose behaviour on macOS is nonetheless unmeasured. | `unverified` | **No macOS machine exists in this lane.** The owner's out-of-band ruling of 2026-09-30 forbids an unattended run to run or fake a macOS step; nothing was run on macOS and nothing was recorded as if it had been. This row closes the "Still ahead" entry that was listed as VR-122-08 before phase 9 ran (that id is now the T070 measurement above). The macOS measurement happens by itself the first time the lane has the machine, through the same tests, which carry their skips with this reason. | The owner, on a macOS runner |

## Still ahead

| Id | Statement | Status | Reason |
|---|---|---|---|
| VR-122-08 | T071, the macOS part of the later platform work of phase 9. | recorded | Phase 9 has run; the statement is recorded `unverified` as **VR-122-09** in the `unverified` table above, with its reason. |

## How to read this record

- Nothing here was faked. A row that says `unverified` had no measurement taken, and the test that
  would take it is present and skips with the reason in this table, so the measurement happens by
  itself the first time the lane has the machine for it.
- A row that says `verified-local` was read back from this machine by the test cited next to it.
  `verified-local` is not `verified-ci`: it is one Linux machine, not a matrix.
- The reasons are the owner's standing ruling of 2026-09-30, not a judgement of this lane.
