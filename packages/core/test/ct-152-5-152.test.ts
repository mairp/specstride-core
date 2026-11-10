/**
 * CT-152-5 — a block of the commit gate is A REJECTION (F152-FR-015).
 *
 * The gate holds the approval commit back; the attempt ends as an outcome, and
 * the counters must treat `commit-blocked` like every other kind of a
 * rejection: the reject count rises, the phase attempt ordinal stands, and the
 * MALFORMED streak is untouched, because a block is no malformed verdict
 * (F101-FR-015).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_COUNTS, countsAfterARejection } from "../src/gate/limits.ts";

test("a block counts as a rejection", () => {
  const counts = countsAfterARejection({
    before: NO_COUNTS,
    ordinal: 1,
    kind: "commit-blocked",
    malformedLimit: 3,
  });
  assert.deepEqual(
    { rejectCount: counts.rejectCount, phaseAttemptOrdinal: counts.phaseAttemptOrdinal, malformedStreak: counts.malformedStreak },
    { rejectCount: 1, phaseAttemptOrdinal: 1, malformedStreak: 0 },
  );
});
