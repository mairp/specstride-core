# Fixture: two-tests-fail (spec 153, task T043)

A fixture workspace whose declared gate fails on EVERY attempt, so the
deterministic verification gate rejects and the red-gate notice of F153-FR-016
is written.

- `package.json` — `scripts.test` is `node ../bin/fail-two-tests.mjs`: the
  engine's declared check (`checkCommandOf`, run-feature.ts) runs `npm test`
  from the work directory, which runs the fake of T002
  (`packages/cli/test/fixtures/loop-speed/bin/fail-two-tests.mjs`, two `FAILED `
  marker lines, exit 1). The path is relative to the WORK directory, so the
  test copies the fake into the sibling `bin/` of the fixture root (where the
  stub `claude` of `loop-speed-helpers.ts` already lives).
- `specs/001-one/tasks.md` — one phase with one task.

The stub proposer of T007 writes the phase evidence; the stub critic would
approve, and is never reached while the gate fails: the gate forces the
rejection before the critic is called (US1c). Used by
`packages/cli/test/engine/loop-speed-notice.test.ts` (T053–T055).
