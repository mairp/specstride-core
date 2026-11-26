/**
 * A stop request is bound to the newest LIVE run of the registry, never to a
 * dead run's entry (found on 2026-11-25: `stop` bound its request to a run
 * that had ended days before, and the live run discarded it).
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import type { ProcessRegistry } from "@specstride/contracts/records/process-registry";
import {
  newestRunTokenHashOf,
  processIsAlive,
} from "../../src/run-control/supervision-registry-entries.ts";

function entryOf(pid: number, startTime: number, hash: string): ProcessRegistry {
  // The shape `entriesOfTheSupervisionRegistry` hands the check: the identity
  // under `identity`, and pid, startTime (ISO) and runTokenHash at the top.
  return {
    schema: "specstride.procs/1",
    procId: "run:run-x:pass-in-flight",
    class: "owned",
    kind: "pass",
    pid,
    processGroup: pid,
    processSession: pid,
    startTime: new Date(startTime).toISOString(),
    runTokenHash: hash,
    runId: "run-x",
    engineStartId: "",
  } as unknown as ProcessRegistry;
}

test("processIsAlive answers for the living and the dead", () => {
  assert.equal(processIsAlive(process.pid), true);
  const child = spawn(process.execPath, ["-e", "process.exit(0)"]);
  const dead = child.pid ?? 0;
  return new Promise((resolve) => {
    child.on("exit", () => {
      assert.equal(processIsAlive(dead), false);
      assert.equal(processIsAlive(0), false);
      assert.equal(processIsAlive(-1), false);
      resolve(undefined);
    });
  });
});

test("the newest LIVE entry names the run, not the newest record", () => {
  const child = spawn(process.execPath, ["-e", "setInterval(() => undefined, 1000)"]);
  const live = child.pid ?? 0;
  try {
    const entries = [
      entryOf(live, 1000, "hash-of-the-live-run"),
      entryOf(999_999_999, 2000, "hash-of-a-dead-run"),
    ];
    assert.equal(newestRunTokenHashOf(entries), "hash-of-the-live-run");
  } finally {
    child.kill("SIGKILL");
  }
});

test("with every entry dead nothing is bound", () => {
  const entries = [entryOf(999_999_998, 1000, "a"), entryOf(999_999_999, 2000, "b")];
  assert.equal(newestRunTokenHashOf(entries), undefined);
});

test("an entry without a hash or a run id is never chosen", () => {
  const none = entryOf(process.pid, 3000, "");
  assert.equal(newestRunTokenHashOf([none]), undefined);
});
