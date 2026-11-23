# Verification record: feature 107 (Launch contract)

This is the verification record of feature 107, written for task **T057**
(phase 7, user story 5).

T057 reads: *paid probe — one delegated batch through each Wave 1 harness
adapter, to move the `unverified` status of F107-FR-011.*

F107-FR-011 carries `status: unverified` in `spec.md` (check: one delegation
through each Wave 1 harness adapter on a live call, a paid probe;
verified-on: —; pin: harness versions).

## Out-of-band ruling and what this record holds

The **paid part is out of band** (the owner's ruling of 2026-09-30, recorded
in `tasks.md` at T057): a live call or capture that costs money is never run
here and never faked. The `unverified` status of F107-FR-011 therefore
STANDS, with the reason below.

The **hermetic part is done**, on Linux, through the fake harness of
CT-107-5: the delegation path this feature ships — resolve the named harness
through the registry via the port, one `completion` call per open item,
every answer recorded with the route `delegated-harness` and the harness id,
the refusal that names the key `derive.judgment.harness` without a named
harness — is exercised end to end on every run.

| Part | Status | Reason / evidence |
|---|---|---|
| Delegation path, hermetic (fake harness through the port, Linux) | verified | `tests/characterization/107/delegation.test.ts` (CT-107-5, T055): 8 tests, all pass on Linux; implementation `packages/pipeline/src/contract/judgment/delegate.ts` (T056) |
| One delegated batch through `adapter-claude` on a live call | **unverified** | paid: a live completion call through the Wave 1 Claude Code adapter costs money; never run and never faked here (owner ruling of 2026-09-30) |
| One delegated batch through `adapter-dsh` on a live call | **unverified** | paid, same ruling |
| One delegated batch through `adapter-codex` on a live call | **unverified** | paid, same ruling |
| One delegated batch through `adapter-pi` on a live call | **unverified** | paid, same ruling |
| One delegated batch through `adapter-prime` on a live call | **unverified** | paid, same ruling |

The Wave 1 adapters (`adapter-claude`, `adapter-dsh`, `adapter-codex`,
`adapter-pi`, `adapter-prime`, `packages/harness`) are skeletons owned by
features 109, 124, 126 and 146 (`packages/harness/src/index.ts`: "skeleton;
the owning features fill it"), so no live probe through them is even
addressable from this feature yet; the probe runs when the owning features
land their adapters AND the owner pays for the live calls.

- Verified-on (hermetic half): Linux, Node.js 22, 2026-10-15
- Verified-by: CT-107-5 in `tests/characterization/107/delegation.test.ts`
- The paid half: never run here; `F107-FR-011` stays `status: unverified`
  in `spec.md` until the owner runs the probe and records it.


## T060 — the parity oracle run (FX-32, FX-33 and FX-34), phase 8

T060 reads: *run FX-32, FX-33 and FX-34 under the `parity` profile on Linux;
record results; macOS runner run marked `unverified` until it passes.*

**Out of band, per the owner's ruling of 2026-09-30:** the macOS-runner part
of T060 is NEVER run here and never faked — GitHub Actions `macos-latest`
runners are paid minutes. It is recorded `unverified` with the reason below.
The Linux part of T060 was run here, hermetically, and PASSED; this phase has
no other open work of its kind (the same ruling covers the macOS step of the
build workflow, `.github/workflows/build.yml`, whose `ubuntu-latest` job runs
the same steps on every push).

### What was run (Linux, hermetic)

- Command: `SPECSTRIDE_PROFILE=parity node tests/isolate.ts node --test
  "tests/parity/107/*.test.ts"` — the whole parity suite of feature 107
  against the oracle fixtures and goldens of
  `packages/oracle/fixtures/FX-32`, `FX-33`, `FX-34` and
  `packages/oracle/golden/`.
- Result: **64 tests, 64 pass, 0 fail** (exit 0). Log kept out of the workdir
  at `/tmp/phase8-parity-107.log`.

| Family | Scenarios exercised | Suite |
|---|---|---|
| FX-32 | `greeting-ready`, `greeting-blocked`, `ambiguous-feature`, `tasks-unreadable-by-old-grammar`, `107-plan-with-other-fence` — derive, inventory, draft, candidates | `tests/parity/107/inventory.test.ts`, `draft.test.ts`, `candidates.test.ts` |
| FX-33 | `valid`, `promote`, the ten `invalid-<class>` members (incl. `invalid-not-promoted` through `launcher-render`), `stale-sources`, `learning-decisions-changed`, `107-promote-unreadable` — validate, identity, coverage, promote | `tests/parity/107/validate-identity.test.ts`, `validate-coverage.test.ts`, `promote.test.ts` |
| FX-34 | `render`, `edited-launcher`, `bundle-reused`, `stale` — render, bundle, layout names | `tests/parity/107/render.test.ts`, `bundle.test.ts`, `layout-names.test.ts` |

| Part | Status | Reason / evidence |
|---|---|---|
| FX-32/FX-33/FX-34 under the `parity` profile on Linux | verified | 64/64 pass, exit 0; command above; suites in the table |
| FX-32/FX-33/FX-34 under the `parity` profile on the GitHub Actions macOS runner | **unverified** | paid: `macos-latest` runner minutes cost money; never run and never faked here (owner ruling of 2026-09-30). The macOS job of `.github/workflows/build.yml` runs the same steps when the owner enables paid runners |

- Verified-on (Linux half): Linux, Node.js 22, 2026-10-15
- Verified-by: `tests/parity/107/*.test.ts` (64 tests), run with
  `SPECSTRIDE_PROFILE=parity`
- The macOS half: `unverified` until the owner runs the paid runner; nothing
  in this feature depends on it for the Linux gate to pass.
