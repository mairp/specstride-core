/**
 * The role grammar of the engine (`criticOf`) and the `--verbose` flag of the
 * engine call.
 *
 * 2026-11-09, feature 152-commit-backpressure: `SPECSTRIDE_CRITIC` set to the
 * bare `<provider>/<model>` form — the form the harness registry's role
 * grammar accepts (`harnesses/roles/names.ts`) — threw inside `criticOf` and
 * ended `run` on the uncaught path (exit 70, one anonymous product line),
 * because the engine arg parser refused `--verbose`, the stack escape hatch
 * of `exit.ts`. The two grammars now agree and `--verbose` is accepted.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { criticOf } from "../../src/engine/run-feature.ts";
import { ENGINE_FLAGS_WITHOUT_VALUE, parseEngineArgs } from "../../src/router/engine-args.ts";

test("criticOf: the dsh-prefixed form names the model", () => {
  assert.deepEqual(criticOf("dsh:zai/glm-5.3-flash"), { dshModel: "zai/glm-5.3-flash" });
});

test("criticOf: the bare provider/model form is accepted as dsh too", () => {
  assert.deepEqual(criticOf("compass-gpt5-high/gpt-5"), {
    dshModel: "compass-gpt5-high/gpt-5",
  });
});

test("criticOf: claude, empty and unset name no dsh model", () => {
  assert.deepEqual(criticOf("claude"), { dshModel: null });
  assert.deepEqual(criticOf(""), { dshModel: null });
  assert.deepEqual(criticOf(undefined), { dshModel: null });
});

test("criticOf: a value without a slash still throws", () => {
  assert.throws(() => criticOf("just-a-name"), /a role must be claude or dsh:/);
});

test("the engine call accepts --verbose (the stack escape hatch of exit.ts)", () => {
  assert.ok(ENGINE_FLAGS_WITHOUT_VALUE.includes("--verbose"));
  // route() strips the verb before parseEngineArgs: the rest is flags only.
  assert.deepEqual(parseEngineArgs(["--verbose"]), { kind: "launch", workdir: undefined });
  assert.deepEqual(parseEngineArgs(["-w", "/tmp/x", "--verbose"]), {
    kind: "launch",
    workdir: "/tmp/x",
  });
});
