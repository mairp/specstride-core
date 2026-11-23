# Quickstart: validating the prime adapter (feature 138)

Runnable checks that show the adapter works end to end without a paid call. Contracts:
`contracts/`; entities: `data-model.md`.

## Prerequisites

- The workspace of the product installed with `npm install` on Node 22 or later.
- The stub executables of feature 141 (`prime` stub, the pi stub) and the recorded streams in
  `packages/adapter-prime/tests/fixtures/streams/`.
- No login, no key, no network.

## 1. Conformance of the adapter

Run the conformance suite of feature 109 against the prime descriptor with the fake binary.
Expected: every operation passes; the environment the fake binary saw holds the two telemetry
switches and no variable outside the allow-list; no file is left behind.

## 2. Replay of the recorded streams

Run the reader's replay suite with the dialect `prime` on the ten as-is streams. Expected: for each,
the normalized records, the display lines and the projected events equal the expected files. Then run
the same suite with the dialect `pi` on the pi streams of feature 134. Expected: same reader code, no
branch on a dialect name.

## 3. The terminal decides

Replay `stock-auth-error` with exit code 0 → failed call, class `provider_auth`, quota class `auth`.
Replay `empty` with exit code 0 → `stream.missing_terminal`. Replay a success terminal with exit
code 1 → not a success.

## 4. Parity through the oracle

Run FX-01 (`harness-prime`, `harness-prime-variant`), FX-06 (`prime-critic-error`), FX-07
(`prime-empty-variant`), FX-18 (`harness-missing-prime`, `harness-missing-prime-launcher`,
`prime-variant-with-model`) and FX-26 (`prime-v3-<name>`) with the profile `parity`. Expected:
`equal`, or `waived` with `DV-112` on the transcript for the two telemetry names, in the scenarios
in which the prime stub is started. No scenario of FX-18 starts it, and FX-07 and FX-18 each hold a
scenario `prime-empty-variant`, for the critic and for the proposer.

## 5. Own checks

- Launch with prime as proposer and no opt-in to C0 → refused before the first pass.
- Plant a tool record in a critic stream (outside `parity`) → the run halts with `critic_not_toolless`.
- Configure prime as critic with no known window, outside `parity` → refused with the reason.
- Doctor with prime configured → warns of unknown terms and of C0.
- Launch with no role named and prime discovered, under each audience → prime is in neither role.
- A proposer pass outside `parity` with no opt-in → the four switches are in the argument list; with the opt-in in project configuration → still there.
- A call at auth tier 2 outside `parity` → the stub sees a home that is not the real home; no such directory is left after the call.
- `prime:<variant>` named as critic → the critic-diversity warning is recorded, with the result `unverified`, and the run goes on.

## 6. Captures (authorized, logged)

Follow `contracts/capture-plan.json`. Each result becomes a fixture with its `verified-on` date and
the version. Until then the affected facts stay `unverified`.
