# Verification record — Claude live capture (feature 126)

Task T001: the live capture of the Claude Code `stream-json` stream, held at
`tests/parity/126/streams/claude-live/` and replayed by
`tests/parity/126/claude-live.test.ts`.

## Paid part — `unverified`

- **Status**: `unverified`
- **What is not done**: no live call was made and no live capture was taken;
  the directory `tests/parity/126/streams/claude-live/` is empty and holds no
  recorded stream.
- **Reason**: the part costs money (a live call or capture). The owner ruled on
  2026-09-30 that a paid, live or person-run step is never run and never faked
  by the specifier; it is recorded `unverified` with its reason and left for
  the owner to run by hand. The task is complete when this record exists.
- **What the capture needs when it is run**: the recorded lines of one live
  `claude -p --output-format stream-json` pass, kept as `stream.json` under
  `tests/parity/126/streams/claude-live/` (only `.ts` and `.json` files may
  live under `tests/`). With the capture in place the replay test
  `tests/parity/126/claude-live.test.ts` asserts the recorded stream through
  the `claude` row of the registry: the same records, route, path and
  artifacts as the checked-in fixture
  `tests/parity/126/streams/claude-cli-successful-stream-keeps-single-unchanged-result/stream.json`.

## Hermetic part (unpaid) — done

The hermetic half of the task is the replay path itself: the fixture
`tests/parity/126/streams/claude-cli-successful-stream-keeps-single-unchanged-result/stream.json`
is replayed through the registry row by the harness tests of this phase
(`packages/harness/test/no-harness-name.test.ts`), and the live test below
skips with its reason while the capture is absent.
