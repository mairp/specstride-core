# Verification record: feature 112 (Doctor) — Phase 1 spike T001

This is the verification record of feature 112, written for task **T001**
(phase 1, `specs/112-doctor/tasks.md`).

T001 reads: *spike: find an existence query for a keychain reference that
prints no value, on Linux and on macOS; record the result and the tool
versions in `specs/112-doctor/research.md` (a note, not code).*

The **macOS runner half is out of band** by the owner's ruling of 2026-09-30:
no macOS runner exists in this checkout, and a macOS task is never run here and
never faked. It is recorded `unverified` below, with its reason, and in
`research.md`. The **hermetic Linux half is done** and its result is below.

## Result of the hermetic half (Linux, 2026-10-15)

- The non-printing existence query exists: **`secret-tool search [--all]
  <attribute> <value>`** (Secret Service). It prints only matched items'
  attribute pairs and item paths — never a secret value. `secret-tool lookup`
  prints the secret itself and is excluded from the doctor.
- Observed hermetically, in a throwaway D-Bus session with a throwaway
  gnome-keyring (no display, no network, no secret read, nothing of the machine
  touched): `secret-tool search --all xdg:schema org.specstride.probe` on an
  absent item exits 0 and prints nothing.
- Consequence for the catalogue: the Linux probe of `auth.<id>.<role>` for the
  Secret Service is **no longer `unprobed`** — D-10 of `research.md` is
  superseded for that case (the note in `research.md` records the supersession).

## Tool versions observed (Linux, Debian, `dpkg`)

| Tool | Version |
|---|---|
| `secret-tool` (libsecret-tools / libsecret-1-0) | 0.21.7-1 |
| `gnome-keyring-daemon` (gnome-keyring) | 48.0-1 |
| `keepassxc-cli` (keepassxc-full) | 2.7.10+dfsg1-1 |
| Node.js | v22.23.2 |

## `unverified` facts

| Fact | Reason | Where it stays open |
|---|---|---|
| macOS: an existence query for a keychain reference that prints no value | Out of band (owner ruling 2026-09-30): a macOS runner is never run and never faked in this lane. Candidate recorded in `research.md` (`security find-generic-password`, output suppressed) | The owner's macOS runner; re-check with the parity oracle and conformance suites |
| The `secret-tool search` query against a *populated* collection | Storing an item in the throwaway keyring needs an interactive unlock prompt (gcr-prompter, no display); only the absent-item form was exercised | A session with an unlocked default collection |

The spike is a note, not code, per the task text: it lives in
`specs/112-doctor/research.md` (§ "Spike T001") and this record. Nothing of the
doctor reads a secret value; both queries the doctor may use are listed there.

---

# Phase 9 (T065) — the macOS statements of the doctor (2026-10-17)

Task T065 reads: *run the macOS runner over the doctor tests and mark every
macOS statement verified or leave it `unverified` with the reason.* By the
owner's ruling of 2026-09-30 (out-of-band), **the macOS runner half is never
run and never faked in this lane**. The hermetic Linux half is done: the whole
doctor test suite runs green on Linux (Node v22, Debian) in this phase —
`packages/doctor`, `packages/testkit` EP-14 conformance,
`tests/security/112/`, `tests/budget/112/` — through the workspace
`npm run test` (phase 9 gate log `p9-gate-npmtest.log`).

## Every macOS statement of the doctor, and its standing

| Statement (where it is made) | Standing | Reason |
|---|---|---|
| `env.os` is ok on macOS; per-platform tools (git, ps, pgrep, keychain tool) as evidence (`packages/doctor/src/checks/env.ts`, catalogue row 2) | `unverified` | No macOS runner exists in this checkout (owner ruling 2026-09-30); the finding carries the marker `macOS unverified` by design until then |
| Every statement the doctor makes about macOS is marked `macOS unverified` (`packages/doctor/src/checks/read.ts`, `MACOS_UNVERIFIED`) | verified as a mechanism on Linux; the macOS VALUES stay `unverified` | The marker is asserted by the tests on Linux; the macOS values themselves need the runner |
| The macOS keychain existence query that prints no value (spike T001, `security find-generic-password` output suppressed) | `unverified` | Out of band, recorded since Phase 1 in this file |
| `--quick` median ≤ 300 ms on macOS (`tests/budget/112/quick.test.ts`; F112-SC-009 notes "run on both platforms") | `unverified` on macOS; verified on Linux this phase (median measured over 30 runs, under the budget) | No macOS runner; the Linux half ran |
| Golden output bytes and token budget on macOS (`tests/budget/112/golden.test.ts`) | `unverified` on macOS; verified on Linux | No macOS runner |
| Parity oracle and conformance suites on a macOS runner | `unverified` | No macOS runner; re-check there when one exists |

No macOS statement is claimed verified. The phase is complete on the ruling's
terms: the hermetic part is done on Linux, the macOS runner part is recorded
`unverified` with its reason, and nothing was faked.
