# Fixtures: 153-loop-feedback-speed

Fake commands and fixture data for the loop-speed tests of feature 153. No test
calls a paid or external model API (F153-FR-060). Each fixture of
`specs/153-loop-feedback-speed/quickstart.md` and the fake that serves it:

- P1b — the notice carries the failure: a gate result with a failing command whose output holds failing test lines, a stack, a planted secret and a planted instruction line — `fail-two-tests.mjs`, `print-planted.mjs`
- P1b (L-5): TAP-shaped output whose failing `not ok` lines no marker prefix lists — `fail-tap.mjs`
- P1e — the enforced time limit: a hung check that forks a grandchild ignoring SIGTERM and holding the pipes — `hang-with-grandchild.mjs`
- P1a — the gate runs what was declared, once: a counting gate command whose executions the tests count — `count-and-pass.ts`
- P2/P4/P5a — report, pins and per-task evidence, handoff: recorded/synthetic state and the stub agents of `packages/cli/test/engine/loop-speed-helpers.ts` (`stubClaude`, `fixture`) — no fake binary

Every fake is a self-contained Node script run by hand as `node <fake>`; the
time-limit fakes are exercised only where process groups are available (they
skip elsewhere, F153-FR-032).
