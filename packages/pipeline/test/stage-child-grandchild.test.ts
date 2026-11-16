/**
 * The wedge of the runtime root: a stage child is spawned detached
 * and its own children are detached with it, so a grandchild that outlives
 * the stage child inherits the stdio pipes and holds them open. `close` —
 * which waits for the streams — then never fires, `runStageChild` never
 * resolves, the stage loop never returns, and the runtime root stays alive
 * holding the workspace lock while every later `launch` is refused with
 * `state=held`. The stage child's own EXIT is the event the loop must be
 * able to go on from.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { runStageChild } from "../src/executor/child.ts";

test(
  "a stage child that leaves a detached grandchild holding the pipes resolves at its own exit",
  async () => {
    // The grandchild holds the child's stdout and stderr open well past the
    // child's own end — the exact shape of an `npm test` tree that survives
    // a stop of the engine. The child itself exits 0 at once.
    const grandchildHoldsThePipes = [
      "const { spawn } = require('node:child_process');",
      "const g = spawn('/bin/sleep', ['30'], { stdio: ['ignore', 'inherit', 'inherit'] });",
      "g.unref();",
      "process.exit(0);",
    ].join("\n");
    const started = Date.now();
    const result = await runStageChild({
      argv: [process.execPath, "-e", grandchildHoldsThePipes],
      env: {},
      kind: "specstride",
      colourOn: false,
      stdoutIsTerminal: false,
      timeLimitSeconds: 120,
    });
    const elapsed = Date.now() - started;
    assert.equal(result.code, 0, "the stage child's own exit is the result");
    assert.ok(
      elapsed < 5_000,
      `resolved in ${String(elapsed)}ms — not held open by the grandchild's pipes`,
    );
  },
  { timeout: 30_000 },
);
