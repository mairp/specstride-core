# Quickstart results: feature 138 (the prime harness adapter)

**Task**: T063 · **Date**: 2026-10-27 ·
**System**: Linux, Node.js 22.23.2 · **Prime agent**: NOT run (the captures of §6 wait for the
owner's authorization, T001; see `verification-record.md`).

Every runnable section of `specs/138-adapter-prime/quickstart.md` was run on this machine, through
the workspace's own test runner (`node tests/isolate.ts node --test <files>`), which is how the
repository runs suites. No login, no key, no network; no paid or external service; the only
executable the adapter's own tests start is the fake binary of EP-02
(`packages/testkit/src/conformance/EP-02/fake-binary.mjs`) and the stubs of feature 141 that
`tests/parity/138/` uses.

## Results

| # | Section | Result | What was observed |
|---|---|---|---|
| 1 | Conformance of the adapter | **pass** | `packages/adapter-prime/tests/conformance/suite.test.ts`: 2 tests, 0 failures. All 17 cases of the harness port's conformance suite (`HC-01`–`HC-17`, `packages/harness/data/plan/conformance-cases.json`) pass against the prime target (`prime-target.ts`) with `externalCalls: 0` and `paidCalls: 0`; the environment the fake binary saw carries both telemetry switches (`PRIME_AGENT_TELEMETRY=0`, `DO_NOT_TRACK=1`) and no variable outside the allow-list; the working tree is cleaned (`HC-15`), nothing is left behind. |
| 2 | Replay of the recorded streams | **pass** | `packages/adapter-prime/tests/reader/replay.test.ts`: 3 tests, 0 failures. The ten as-is streams of `packages/adapter-prime/tests/fixtures/streams/asis/` replay equal to the generated expected records, display lines and projected events with the dialect `prime`; the ten family streams of `pi-family/` replay through the SAME reader code with the dialect `pi` — no branch on a dialect name. |
| 3 | The terminal decides | **pass** | `tests/parity/138/c169-terminals.test.ts` and the reader suite: `stock-auth-error` (exit 0) is a failed call of class `provider_auth`, quota class `auth`; a stream without a terminal record is `stream.missing_terminal`; a success terminal with exit 1 is not a success. |
| 4 | Parity through the oracle | **pass** | `tests/parity/138/` (13 suites): **123 tests, 0 failures.** FX-01 (`harness-prime`, `harness-prime-variant`), FX-06 (`prime-critic-error`), FX-07 (`prime-empty-variant`), FX-18 (`harness-missing-prime`, `harness-missing-prime-launcher`, `prime-variant-with-model`) and FX-26 (`prime-v3-<name>`) hold. Verdicts are `equal` or `waived` with `DV-112` on the transcript for the two telemetry names only in the scenarios in which the prime stub is started; no scenario of FX-18 starts it (`c054-not-found.test.ts`). |
| 5 | Own checks | **pass** | `tests/characterization/138/` (12 suites, incl. `facts.test.ts` of T060): **118 tests, 0 failures.** The C0 refusal before the first pass, the `critic_not_toolless` halt, the unknown-window refusal, the doctor's unknown-terms and C0 warnings, the no-role discovery, the four switches with and without the opt-in, the tier-2 home that is not the real home and leaves nothing behind, and the critic-diversity warning with result `unverified` — all hold. |
| 6 | Captures (authorized, logged) | **not run, with its reason** | Not run and not faked. `contracts/capture-plan.json`: "Run only by explicit authorization; this feature runs none." The owner ruling of 2026-09-30 puts the five captures and the two live probes out of band. No capture fixture exists; the affected facts of `spec.md` stay `unverified` in `verification-record.md` (T061), held to account by `tests/characterization/138/facts.test.ts`. |

## Summary

| Result | Sections |
|---|---|
| pass | 1, 2, 3, 4, 5 |
| not run, with its reason | 6 (owner-authorized captures; out of band) |
| fail | none |

A skip is never read as a pass (the constitution, principle XVII).
