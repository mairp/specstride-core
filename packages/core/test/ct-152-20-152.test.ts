/**
 * CT-152-20 — the event of a block carries NO content (F152-FR-020,
 * F101-FR-038).
 *
 * `commit_gate.blocked` names the phase, the attempt, the rule ids, the number
 * of files and the hash of the signature — never a file name and never a
 * match. The emitter refuses rather than write an event whose `data` carries a
 * secret: a list in the data is content-bearing, so a planted secret inside
 * `rules` throws `ForbiddenEventContentError`, and clean rule ids pass.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMIT_GATE_BLOCKED_EVENT_TYPE,
  ForbiddenEventContentError,
  emit,
} from "../src/gate/events.ts";

function emitBlocked(rules: readonly string[]): void {
  emit({
    type: COMMIT_GATE_BLOCKED_EVENT_TYPE,
    seq: 1,
    ts: "2026-11-09T00:00:00Z",
    identity: { runId: "run-1", launchId: "l-1", phaseId: "p1", attemptId: "a1", attempt: 1 },
    data: {
      phase: 1,
      attempt: 2,
      rules,
      fileCount: 1,
      // The signature is a hash of the block's facts, not a nonce in the form
      // F101-FR-006 gives, so the case exercises the content check alone.
      signature: "f".repeat(64),
    },
  });
}

test("the event carries no content", () => {
  assert.throws(
    () => emitBlocked(["cg-bearer", `sk${"-"}AAAAAAAAAAAA`]),
    ForbiddenEventContentError,
    "a secret planted in the rule list is refused",
  );
  assert.doesNotThrow(() => emitBlocked(["cg-bearer", "cg-unreadable"]));
});
