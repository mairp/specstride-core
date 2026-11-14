/**
 * THE LOCK-OWNER FALLBACK OF `stop --now` (B-1550, the no-op stop of a live
 * pass) — the fix pinned here, over the REAL router, the REAL control root
 * and REAL processes:
 *
 *  - a resumed run's supervision registry can hold the pass pid of an
 *    EARLIER launch; the workspace lock's owner record carries the identity
 *    facets of the LIVE holder (annex B §B.9), and `--now` maps it into an
 *    entry for the identity check and ends the live pass where the registry
 *    went stale;
 *  - every guard stands: a dead or malformed owner record ends nothing, a
 *    registry entry that already covers the pid is signalled through its
 *    own entry, and the printed line names the pid that was truly ended;
 *  - where no lock record stands at all, the lines are the ones
 *    `stop-mount.test.ts` already pins — the fallback changes nothing.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { SCHEMA_ID } from "@specstride/contracts/records/owner-record";
import { layoutVersion } from "@specstride/contracts/ids/logical-names";
import { platformProcessTableIo, processGroupOf, startTimeOf } from "@specstride/kernel";

import {
  entriesWithTheLockOwner,
  isEpochMillisText,
  lockOwnerEntryOf,
} from "../../src/run-control/lock-owner-entry.ts";
import { hashOfToken, RUN_TOKEN_VAR } from "../../src/run-control/signal-owned.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { route } from "../../src/router/route.ts";
import type { ProcessRegistry } from "@specstride/contracts/records/process-registry";

/** A captured io for the router. */
function captureIo(): { out: (t: string) => void; err: (t: string) => void; lines: string[] } {
  const lines: string[] = [];
  return {
    out: (t) => lines.push(t),
    err: (t) => lines.push(t),
    lines,
  };
}

/** A workspace with the state the router's guard and the command check. */
function aWorkspace(): { workdir: string; controlRoot: string; dispose: () => void } {
  const workdir = mkdtempSync(join(tmpdir(), "par4-stop-lockowner-"));
  mkdirSync(join(workdir, ".specstride"), { recursive: true });
  const controlRoot = controlRootOfWorkspace(workdir);
  mkdirSync(controlRoot, { recursive: true });
  writeFileSync(
    join(controlRoot, "workspace.json"),
    JSON.stringify({
      schema: "specstride.layout/1",
      layoutVersion,
      workspaceId: "0123456789abcdef",
      realPath: workdir,
      createdAt: new Date().toISOString(),
      productVersion: "test",
      lockProvider: { id: "test", version: "1" },
    }),
  );
  return {
    workdir,
    controlRoot,
    dispose: () => {
      rmSync(workdir, { recursive: true, force: true });
      rmSync(controlRoot, { recursive: true, force: true });
    },
  };
}

/** A registry file holding ONE owned entry for a pid. */
function writeRegistry(
  controlRoot: string,
  pid: number,
  token: string,
  startedAtMs: number = Date.now() - 5_000,
): void {
  const entry = {
    "run:the-run:pass-in-flight": {
      logicalName: "run:the-run:pass-in-flight",
      identity: {
        pid,
        groupId: pid,
        sessionId: pid,
        startedAtMs,
        runTokenHash: hashOfToken(token),
      },
      registryClass: "pass",
      survivesStop: false,
    },
  };
  writeFileSync(join(controlRoot, "procs.json"), JSON.stringify(entry));
}

/** An owner record of §B.9 for a pid, written where the command reads it. */
function writeLockOwner(
  controlRoot: string,
  pid: number,
  startedAtMs: number | null,
): void {
  mkdirSync(join(controlRoot, "lock"), { recursive: true });
  writeFileSync(
    join(controlRoot, "lock", "owner.json"),
    JSON.stringify({
      schema: SCHEMA_ID,
      pid,
      processGroup: pid,
      startTime: startedAtMs === null ? "unknown" : String(startedAtMs),
      bootId: "test-boot",
      hostName: "test-host",
      pidNamespace: null,
      launchId: "launch-test",
      runTokenHash: createHash("sha256").update("the-run-token", "utf8").digest("hex"),
    }),
  );
}

/** A live stub that leads its own group and holds the run token. */
async function aLiveStub(): Promise<{ pid: number; startedAtMs: number; dispose: () => void }> {
  const child: ChildProcess = spawn("sleep", ["600"], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, [RUN_TOKEN_VAR]: "the-run-token" },
  });
  const pid = child.pid as number;
  const startedAtMs = startTimeOf(pid, platformProcessTableIo);
  assert.ok(typeof startedAtMs === "number", "the stub's start time reads");
  const group = processGroupOf(pid) ?? pid;
  assert.equal(group, pid, "the detached stub leads its own group");
  return {
    pid,
    startedAtMs,
    dispose: () => {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Already gone.
      }
    },
  };
}

/** A pid that is already gone. */
function aGonePid(): number {
  const gone = spawnSync("true", []);
  assert.equal(gone.status, 0);
  return gone.pid as number;
}

/** Bounded wait for a pid to end — the check polls, never spins. */
async function untilGone(pid: number): Promise<boolean> {
  for (let at = 0; at < 40; at += 1) {
    try {
      process.kill(pid, 0);
    } catch {
      return true;
    }
    await new Promise((wait) => setTimeout(wait, 50));
  }
  return false;
}

test("the owner record maps to a registry entry, and a start time that cannot be judged maps to none", () => {
  const pid = aGonePid();
  const record = {
    schema: SCHEMA_ID,
    pid,
    processGroup: pid,
    startTime: String(Date.now()),
    bootId: "test-boot",
    hostName: "test-host",
    pidNamespace: null,
    launchId: "launch-test",
    runTokenHash: hashOfToken("the-run-token"),
  };
  const entry = lockOwnerEntryOf(record);
  assert.ok(entry !== null, "a valid owner record maps");
  assert.equal(entry.pid, pid);
  assert.equal(entry.class, "owned");
  assert.equal(entry.processGroup, pid);
  assert.equal(Number.isNaN(Date.parse(entry.startTime)), false, "the start time is an ISO instant");
  // A `startTime` the platform would not give — the `unknown` of §B.9 — is
  // not an identity the check may judge.
  assert.equal(lockOwnerEntryOf({ ...record, startTime: "unknown" }), null);
  assert.equal(lockOwnerEntryOf({ ...record, startTime: "not-a-number" }), null);
  // Not an owner record at all.
  assert.equal(lockOwnerEntryOf(null), null);
  assert.equal(lockOwnerEntryOf("nonsense"), null);
  assert.equal(lockOwnerEntryOf({ ...record, runTokenHash: undefined }), null);
});

test("the epoch-millis text predicate holds the decimal and refuses everything else", () => {
  assert.equal(isEpochMillisText("1731234567890"), true);
  assert.equal(isEpochMillisText(""), false);
  assert.equal(isEpochMillisText("unknown"), false);
  assert.equal(isEpochMillisText("12x"), false);
  assert.equal(isEpochMillisText(1731234567890), false);
  assert.equal(isEpochMillisText(null), false);
});

test("a pid the registry already covers is appended nowhere", () => {
  const covered = [
    {
      schema: "specstride.procs/1",
      procId: "run:the-run:pass-in-flight",
      class: "owned",
      kind: "engine",
      pid: 4242,
      processGroup: 4242,
      processSession: 4242,
      startTime: new Date().toISOString(),
      runTokenHash: hashOfToken("the-run-token"),
      runId: "the-run",
      engineStartId: "",
    } as ProcessRegistry,
  ];
  const samePidRecord = {
    schema: SCHEMA_ID,
    pid: 4242,
    processGroup: 4242,
    startTime: String(Date.now()),
    bootId: "b",
    hostName: "h",
    pidNamespace: null,
    launchId: "l",
    runTokenHash: hashOfToken("the-run-token"),
  };
  assert.equal(entriesWithTheLockOwner(covered, samePidRecord).length, 1, "no duplicate entry");
  assert.equal(entriesWithTheLockOwner(covered, null).length, 1, "no record appends nothing");
  assert.equal(entriesWithTheLockOwner(covered, "nonsense").length, 1, "a bad record appends nothing");
});

test("stop --now ends the LIVE holder through the lock owner where the registry went stale", async () => {
  const w = aWorkspace();
  const stub = await aLiveStub();
  try {
    // The registry of an earlier launch: a pid that is gone.
    writeRegistry(w.controlRoot, aGonePid(), "no-such-token");
    // The lock's owner record: the LIVE stub, with the facets of §B.9.
    writeLockOwner(w.controlRoot, stub.pid, stub.startedAtMs);
    const io = captureIo();
    const exit = await route(["stop", "--now", "-w", w.workdir], { io, handlers: {} });
    assert.equal(exit, 0);
    assert.match(
      io.lines.join(""),
      new RegExp(`killed in-flight agent pass \\(pid ${String(stub.pid)} \\+ descendants\\)`),
      "the killed line names the pid that was truly ended",
    );
    assert.equal(await untilGone(stub.pid), true, "the live holder was ended by the stop");
  } finally {
    stub.dispose();
    w.dispose();
  }
});

test("stop --now with a dead lock owner and a stale registry sends nothing", async () => {
  const w = aWorkspace();
  try {
    writeRegistry(w.controlRoot, aGonePid(), "no-such-token");
    writeLockOwner(w.controlRoot, aGonePid(), Date.now() - 5_000);
    const io = captureIo();
    const exit = await route(["stop", "--now", "-w", w.workdir], { io, handlers: {} });
    assert.equal(exit, 0);
    const printed = io.lines.join("");
    assert.match(printed, /is not running — nothing to kill/);
    assert.doesNotMatch(printed, /killed in-flight agent pass/);
  } finally {
    w.dispose();
  }
});

test("a malformed lock owner record changes nothing", async () => {
  const w = aWorkspace();
  try {
    writeRegistry(w.controlRoot, aGonePid(), "no-such-token");
    mkdirSync(join(w.controlRoot, "lock"), { recursive: true });
    writeFileSync(join(w.controlRoot, "lock", "owner.json"), JSON.stringify("nonsense"));
    const io = captureIo();
    const exit = await route(["stop", "--now", "-w", w.workdir], { io, handlers: {} });
    assert.equal(exit, 0);
    const printed = io.lines.join("");
    assert.match(printed, /is not running — nothing to kill/);
    assert.doesNotMatch(printed, /killed in-flight agent pass/);
  } finally {
    w.dispose();
  }
});

test("a fresh registry that already covers the live pid is signalled through its own entry", async () => {
  const w = aWorkspace();
  const stub = await aLiveStub();
  try {
    // The registry of THIS launch: the live stub, its true start time and
    // token — the identity check must pass on it.
    writeRegistry(w.controlRoot, stub.pid, "the-run-token", stub.startedAtMs);
    // The lock names the same holder: appended nowhere (one pid, one signal).
    writeLockOwner(w.controlRoot, stub.pid, stub.startedAtMs);
    const io = captureIo();
    const exit = await route(["stop", "--now", "-w", w.workdir], { io, handlers: {} });
    assert.equal(exit, 0);
    assert.match(
      io.lines.join(""),
      new RegExp(`killed in-flight agent pass \\(pid ${String(stub.pid)} \\+ descendants\\)`),
    );
    assert.equal(await untilGone(stub.pid), true, "the recorded process was ended by the stop");
  } finally {
    stub.dispose();
    w.dispose();
  }
});
