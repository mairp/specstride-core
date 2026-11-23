# Quickstart: validating the dsh harness adapter (feature 130)

A guide to the runnable checks that prove the feature end to end. No step calls a model or a
paid service. Steps that need a real harness are captures and are authorized by a person, logged,
and never run by CI.

## Prerequisites

- The workspace of the product installed with `npm install` on Linux (macOS `unverified`).
- The fake binary named after the as-is command, the stub plugin installer and the recorded
  fixtures of feature 141 (FX-01, FX-06, FX-07, FX-16 to FX-20, FX-22, FX-24, FX-25, FX-26, FX-38,
  FX-39).
- For captures only: the installed harness at exactly `0.1.0-rc.8`.

## 1. Proposer, parity

Run the parity tests `PT-130-C-052-*`, `PT-130-C-056-*`, `PT-130-C-058-*` on FX-01 and FX-26.
Expected: argument list, environment names and prompt equal the reference; no overlay without a
model; with a model, a throwaway home that is removed after the pass.

## 2. Proposer, failures

Run FX-18 (`harness-missing-dsh`, `dsh-model-and-qualifier`, `dsh-no-provider`,
`dsh-overlay-cannot-build`). Expected: 127, and the three messages of F130-FR-012 and F130-FR-014
with the component name `pass-loop`. The loop ends as the catalogue of feature 141 states for
each scenario.

## 3. Critic

Run FX-01, FX-06, FX-07 for the critic (`PT-130-C-061-*`, `PT-130-C-066-*`), and FX-25 for the
window. Then run the conformance suite with a fake binary that exposes one more tool id.
Expected: parity passes under `parity`; under `strict` the extra tool id refuses the critic role
with `critic_not_toolless`, and a version other than the pin does the same. The two reference
errors of FX-07 (`dsh-conflicting-providers`, `dsh-invalid-model-ref`) end as failed critic calls:
engine exit 1, `critic_unavailable`.

## 4. Plugin protocol

Run FX-38 with the stub installer: every scenario named in `spec.md` User Story 4. Expected:
the installer is called with the fixed argument list, a receipt and an archived request exist for
`installed-then-restart`, results 7 and 4 for the refusals and the final pass, no installer call
after a denial.

## 5. Signals

Feed the classifier fixtures: each of the four codes on each of the two streams. Expected: the
classes of `contracts/classifier-entries.json`; `CONTEXT_WINDOW_EXCEEDED` never MALFORMED.

## 6. Real home untouched

Run a pass without the protocol against a fixture home and compare bytes before and after.
Expected: identical (F130-SC-005).

## 7. Customisations, native memory and the pick

Run CT-130-30 and CT-130-43 to CT-130-45 on the fake binary. Expected: with no harness named, dsh
is never the proposer and never the critic, under both audiences; named as proposer, the run
record holds `not-switchable` for every kind and the doctor warns; named as critic outside
`parity`, the role is refused with `memory-not-off` until a capture shows `off` or `absent`;
under `parity` the states are `as-is` and no line is added.

## 8. Captures (authorized, logged)

Follow `contracts/capture-plan.json`. Store each result as a fixture that states the version.
Expected: the requirements that wait for a capture change from `unverified` to a dated status, or
stay `unverified` in the release notes.
