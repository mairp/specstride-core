/**
 * CT-152-7 — a block of the commit gate does NOT count towards K of the
 * model-tier bump (F152-FR-007; CQ-152-03 A).
 *
 * The premise: the attempt a block ends had its verification gate PASSED and
 * its verdict APPROVED, and only a verdict REJECTED of the critic counts
 * towards K (F149-FR-004). This test pins that premise: if it ever fails, the
 * premise of CQ-152-03 A is wrong and the owner must be asked again.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  A_BLOCKED_COMMIT_COUNTS_TOWARDS_K,
  criticRejectionsAfter,
  rejectionCountsTowardsK,
} from "../src/ep18/planner-tier-bump.ts";

/** The outcome of the phase gate a BLOCKED attempt ends with (F152-FR-001). */
const OUTCOME_OF_A_BLOCKED_ATTEMPT = {
  verificationGatePassed: true,
  verdict: "APPROVED" as const,
};

test("a block does not count towards K", () => {
  assert.equal(
    rejectionCountsTowardsK(OUTCOME_OF_A_BLOCKED_ATTEMPT),
    false,
    "the blocked attempt's verdict is APPROVED, so it never counts towards K",
  );
  assert.equal(
    criticRejectionsAfter(0, OUTCOME_OF_A_BLOCKED_ATTEMPT),
    0,
    "the count of critic rejections stays 0 through a block",
  );
  assert.equal(
    criticRejectionsAfter(2, OUTCOME_OF_A_BLOCKED_ATTEMPT),
    2,
    "a block neither adds to nor resets K",
  );
  // The constant names the premise (T104); it must stay false.
  assert.equal(A_BLOCKED_COMMIT_COUNTS_TOWARDS_K, false);
});
