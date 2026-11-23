# Verification record — experiment X0 (feature 126)

Task T024: the live part of experiment X0 — 20 live passes on a real harness,
5 of them killed on purpose; pass mark 100 per cent of passes accounted for,
totals within 2 per cent (F126-SC-001).

## Paid part — `unverified`

- **Status**: `unverified`
- **What is not done**: no live call was made and no live capture was taken;
  the 20 live passes (5 killed on purpose) were not run.
- **Reason**: the part costs money (a live call or capture). The owner ruled on
  2026-09-30 that a paid, live or person-run step is never run and never faked
  by the specifier; it is recorded `unverified` with its reason and left for
  the owner to run by hand. The task is complete when this record exists.
- **What the pass mark needs when it is run**: 100 per cent of the 20 passes
  accounted for (complete usage, or `usage.unavailable`, or a killed pass with
  its partial usage and `usageComplete=false`), and the sum of the
  `usage.reported` increments within 2 per cent of the harness's own session
  total.

## Hermetic part (unpaid, on Linux) — done

The stub-agent form of the same experiment, which the task assigns to T021 and
T025, is implemented and run here:

- Script: `specs/126-stream-seam-and-invocation/scripts/x0-hermetic.ts`
  (run with `node tests/isolate.ts node specs/126-stream-seam-and-invocation/scripts/x0-hermetic.ts`).
- 20 deterministic stub passes, 5 of them killed mid-pass (half of each
  killed pass's usage records removed), replayed through
  `UsageAccountant` (`packages/harness/src/stream/usage.ts`), the share read
  through `accountedShare` (`packages/harness/src/invocation/accounting.ts`).
- Result of the run of 2026-10-20:
  `X0-hermetic: passes=20 killed=5 accounted=20/20 share=100% reported_total=182337 ground_truth_total=182337 drift=0.0000% PASS`
- Every killed pass kept its partial usage with `usageComplete=false` and
  counted as accounted for (F126-FR-023, F126-FR-036); per-pass totals matched
  the ground-truth session totals exactly, within the 2 per cent mark.
- Own tests that prove the same behaviour: CT-126-4
  (`tests/parity/126/usage-accounting.test.ts`) and CT-126-7
  (`tests/parity/126/accounted-share.test.ts`).
