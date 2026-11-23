# Verified — what has been run, and what stays `unverified`

Feature 117 — Critic grounding and prompt.

What has been **run**, with what result, and what stays **`unverified`** and
why. A test whose prerequisite is missing reports a **skip with its reason**
and never a pass. Nothing here is faked; this is the out-of-band owner ruling
of 2026-09-30 (T090): the macOS part is never run here and never faked.

## The hermetic part on Linux — done

Every test of the feature runs on this host (Linux x86_64, Node.js 22) with no
credential and no network: the unit tests of `packages/core` under
`test/critic-input/`, the parity tests of `tests/parity/117/`, and the
characterization tests of `tests/characterization/117/` (quickstart scenarios
1 to 8). The gate commands of phase 8 run them again.

Per-prerequisite skip behaviour, as the tests carry it today:

| Prerequisite | Behaviour when missing | Where |
|---|---|---|
| The oracle of feature 141 with its golden captures | The reference half of a parity test reports a **skip with its reason** (`REFERENCE_HALF_SKIP`): "the reference half needs the oracle of feature 141 with its golden captures; packages/oracle is a skeleton, so the reference half reports a SKIP and never a pass" | `tests/parity/117/oracle.ts` |
| Symbolic links | The link cases report a skip with its reason (a host without them never passes the link half) | `tests/characterization/117/CT-117-18.test.ts` |
| The reference tree of the baseline | The differential tests report a skip with the reason, never a pass | the parity tests of `tests/parity/117/` |
| A macOS runner | Nothing is run and nothing is faked; see below | — |

## On macOS: **`unverified`**

**Status: every macOS statement of this feature is `unverified`. No macOS
runner has run any test of feature 117.**

Reason: no macOS runner exists in the build workflow of this repository, and
this host is Linux (`uname -sm` → `Linux x86_64`). The macOS statements of
`specs/117-critic-grounding-and-prompt/plan.md` (Target Platform heading) —
the local-time form of the modification time, real-path resolution through
links, and the move of files across file systems — are therefore recorded as
`unverified` with this reason, here and per test where the test names them.
They become verified only when such a runner exists and has run the suite.

The cross-file-system case of the file-moving port needs no second mount by
construction: the adapter writes to a temporary name in the target directory,
sets mode and modification time, renames inside one directory and only then
removes the source — no rename ever crosses a device
(`tests/characterization/117/CT-117-40-port.test.ts`, header comment).

The task is complete when this record exists; it does.
