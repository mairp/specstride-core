/**
 * CT-153-36 — the timed pair of the commit gate holds no content
 * (F153-FR-036, F101-FR-038).
 *
 * `commit_gate.started` opens a scan and `commit_gate.ended` closes it. Both
 * carry only the catalogue's fields — phase, attempt, step, durationMs,
 * outcome, hits (the closer adds the optional `synthesized`) — and no free
 * text: `step` is the closed set `pre-critic` | `commit` of F111-FR-031 as
 * amended, `outcome` is `clear` | `blocked`, and `hits` is a count, never a
 * match. A secret planted in any field of the pair is refused: the emitter
 * throws `ForbiddenEventContentError` rather than write the event, and clean
 * data passes.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import {
  COMMIT_GATE_STARTED_EVENT_TYPE,
  COMMIT_GATE_ENDED_EVENT_TYPE,
  ForbiddenEventContentError,
  emit,
} from "../src/gate/events.ts";

const SECRET = "a1b2c3d4e5f60718"; // a nonce in the form F101-FR-006 gives

function emitTiming(type: string, step: string, overrides: Record<string, unknown> = {}): void {
  emit({
    type,
    seq: 1,
    ts: "2026-11-13T00:00:00Z",
    identity: { runId: "run-1", launchId: "l-1", phaseId: "p1", attemptId: "a1", attempt: 1 },
    data: {
      phase: 1,
      attempt: 1,
      step,
      durationMs: 0,
      outcome: "clear",
      hits: 0,
      ...overrides,
    },
  });
}

test("the pair holds no content", () => {
  // Both types of the pair refuse a planted secret, wherever it lands.
  assert.throws(
    () => emitTiming(COMMIT_GATE_STARTED_EVENT_TYPE, SECRET),
    ForbiddenEventContentError,
    "a secret planted in `step` of the opener is refused",
  );
  assert.throws(
    () => emitTiming(COMMIT_GATE_ENDED_EVENT_TYPE, "commit", { outcome: SECRET }),
    ForbiddenEventContentError,
    "a secret planted in `outcome` of the closer is refused",
  );
  assert.throws(
    () => emitTiming(COMMIT_GATE_STARTED_EVENT_TYPE, "pre-critic", { phase: SECRET as unknown as number }),
    ForbiddenEventContentError,
    "a secret planted in `phase` is refused",
  );
  // Clean data of both steps passes for both types.
  assert.doesNotThrow(() => emitTiming(COMMIT_GATE_STARTED_EVENT_TYPE, "pre-critic"));
  assert.doesNotThrow(() => emitTiming(COMMIT_GATE_STARTED_EVENT_TYPE, "commit"));
  assert.doesNotThrow(() =>
    emitTiming(COMMIT_GATE_ENDED_EVENT_TYPE, "pre-critic", { durationMs: 7, outcome: "blocked", hits: 2 }),
  );
  assert.doesNotThrow(() =>
    emitTiming(COMMIT_GATE_ENDED_EVENT_TYPE, "commit", { durationMs: 3, outcome: "clear", hits: 0 }),
  );
});

test("the schema of the pair is tracked and matches the constants", () => {
  // The schema lives in the repo-tracked contracts directory (the copy under
  // specs/ is the owner's and is excluded from snapshots).
  const path = fileURLToPath(new URL("../../contracts/schemas/commit-gate-timing.schema.json", import.meta.url));
  const schema = JSON.parse(readFileSync(path, "utf8")) as {
    $id: string;
    required: string[];
    properties: Record<string, { enum?: string[] }>;
  };
  assert.equal(schema.$id, "specstride.commit-gate-timing/1");
  assert.deepEqual(
    [...schema.required].sort(),
    ["attempt", "durationMs", "hits", "outcome", "phase", "schema", "step"],
    "required is the schema id (LR-11) plus the six fields of CommitGateTimingEventData",
  );
  assert.deepEqual(schema.properties.step.enum, ["pre-critic", "commit"]);
  assert.deepEqual(schema.properties.outcome.enum, ["clear", "blocked"]);
});
