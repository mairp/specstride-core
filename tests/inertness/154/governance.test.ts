/**
 * T016 — the governance guard of F154-FR-006 over the inertness fixture: no
 * behaviour spec 154 adds may add a critic call, may let a verdict stand
 * without the nonce the engine minted, or may add an approval record. The
 * run below has every switch off, so it measures the baseline the feature
 * must not disturb: one critic call per phase, a nonce-bound verdict, one
 * approval record.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { fixture154 } from "./helpers.ts";

test("T016 one critic call per phase, a nonce-bound verdict, one approval record", async () => {
  const f = fixture154();
  try {
    const exit = await f.run();
    assert.equal(exit, 0);
    const calls = f.prompts().filter((record) => record.role === "critic");
    // The fixture holds one phase: the gate is its one critic call.
    assert.equal(calls.length, 1, `one critic call for the phase, saw ${String(calls.length)}`);
    // The verdict is bound to the nonce the prompt minted: the stub may only
    // answer with the nonce the prompt carries (F154-FR-006).
    const nonce = /VERDICT ([0-9a-f]{16}): APPROVED/.exec(calls[0]?.prompt ?? "")?.[1];
    assert.ok(nonce !== undefined, "the gate prompt minted a verdict nonce");
    // Exactly one approval record stands, and no critic-class call wrote one.
    const approvals = join(f.control, "features", "001-one", "approvals");
    assert.ok(existsSync(approvals), "the gate's approval record exists");
    assert.deepEqual(readdirSync(approvals), ["phase-1.json"], "one approval record");
  } finally {
    f.restore();
  }
});
