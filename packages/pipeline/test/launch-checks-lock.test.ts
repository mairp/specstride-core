/**
 * The lock the launch check reads through the provider of EP-13: the states
 * `held`, `stale`, `foreign` and `free`, the mapping from the probe outcome,
 * and the decision of check 6 on each (the bug of 2026-11-08; F123-FR-021,
 * F123-FR-022).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  checkRunDirectoryFree,
  decisionOfRefusal,
  isLaunchCheckRefusal,
  runLaunchChecks,
  type LaunchCheckContext,
  type LaunchCheckOutcome,
} from "../src/launch-checks/checks.ts";
import {
  describeLockState,
  lockStateOfProbe,
  nextForLockState,
  type WorkspaceLockState,
} from "../src/launch-checks/lock-state.ts";
import type { LockReading, ProbeOutcome } from "../../runtime/src/lock/probe.ts";

/** A probe outcome built from its visible parts, for the mapping table. */
function outcomeOf(
  result: ProbeOutcome["result"],
  reading: Partial<LockReading>,
  because = "a row of the decision table",
): ProbeOutcome {
  return {
    result,
    row: "P?",
    because,
    held: result !== "free" && result !== "stale-owner-dead",
    observed: {
      lockExists: reading.lockExists ?? true,
      providerFailed: false,
      ownerRecordReadable: reading.ownerRecordReadable ?? true,
      foreign: false,
      sameBoot: true,
      liveness: "alive",
      anOpenOwnedEntryPassesTheIdentityCheck: false,
    },
    reading: {
      lockExists: reading.lockExists ?? true,
      owner: reading.owner ?? null,
      ownerRecordReadable: reading.ownerRecordReadable ?? true,
      refusal: reading.refusal ?? null,
    } as LockReading,
  } as ProbeOutcome;
}

/** An owner record as the shipped provider writes it. */
function ownerOf(pid: number, runId: string): Record<string, unknown> {
  return {
    pid,
    runId,
    acquiredAt: new Date(Date.now() - 7_200_000).toISOString(),
  };
}

test("a live owner is `held` and the decision of its reason is `attach` (F123-FR-022)", () => {
  const lock = lockStateOfProbe(outcomeOf("held-live", { owner: ownerOf(4242, "run-live") }));
  assert.equal(lock.state, "held");
  assert.equal(lock.pid, 4242);
  assert.equal(lock.runId, "run-live");
  assert.equal(decisionOfRefusal("already-running"), "attach");
});

test("a lock held from another host still counts as held (§F.5)", () => {
  const lock = lockStateOfProbe(outcomeOf("held-foreign", { owner: ownerOf(7, "run-afar") }));
  assert.equal(lock.state, "held");
});

test("a dead owner is `stale`, with its run and age (the bug of 2026-11-08)", () => {
  const lock = lockStateOfProbe(
    outcomeOf("stale-owner-dead", { owner: ownerOf(999, "20261106-232038-3905018") }),
  );
  assert.equal(lock.state, "stale");
  assert.equal(lock.runId, "20261106-232038-3905018");
  assert.equal(typeof lock.ageSeconds, "number");
  assert.match(nextForLockState(lock) ?? "", /unlock --stale/);
});

test("a lock whose owner record cannot be read is FOREIGN, with the orchestrator named", () => {
  const dir = mkdtempSync(join(tmpdir(), "specstride-lock-"));
  try {
    const lockPath = join(dir, "lock");
    writeFileSync(lockPath, "20261106-232038-3905018 2026-11-06T23:20:38+04:00\n");
    const lock = lockStateOfProbe(
      outcomeOf(
        "unknown",
        {
          lockExists: true,
          owner: null,
          ownerRecordReadable: false,
          refusal: "the owner record cannot be read: unexpected end of JSON input",
        },
        "the owner record can be read and carries every required field",
      ),
      lockPath,
    );
    assert.equal(lock.state, "foreign");
    assert.equal(lock.owner, "orchestrator");
    assert.equal(lock.runId, "20261106-232038-3905018");
    assert.equal(typeof lock.ageSeconds, "number");
    assert.match(nextForLockState(lock) ?? "", /by hand/);
    assert.match(describeLockState(lock), /owner=orchestrator/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an unreadable DIRECTORY lock with no parseable line is foreign without an invented owner", () => {
  const dir = mkdtempSync(join(tmpdir(), "specstride-lock-"));
  try {
    const lockPath = join(dir, "lock");
    mkdirSync(lockPath);
    const lock = lockStateOfProbe(
      outcomeOf("unknown", { lockExists: true, owner: null, ownerRecordReadable: false }),
      lockPath,
    );
    assert.equal(lock.state, "foreign");
    assert.equal(lock.owner, undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("no lock is `free`, and any other unknown counts as held (§F.5)", () => {
  assert.equal(lockStateOfProbe(outcomeOf("free", { lockExists: false })).state, "free");
  const unknown = lockStateOfProbe(outcomeOf("unknown", { owner: ownerOf(1, "run-x") }));
  assert.equal(unknown.state, "held");
  const group = lockStateOfProbe(
    outcomeOf("owner-dead-group-alive", { owner: ownerOf(2, "run-y") }),
  );
  assert.equal(group.state, "held");
});

/** A context whose checks 1 to 5 pass, so `runLaunchChecks` reaches check 6. */
function contextWith(lock: WorkspaceLockState): LaunchCheckContext {
  return {
    launcherPath: launcherPath(),
    contractValidation: { status: "validated", errorText: "" },
    repoRoot: "/",
    authorizedRoots: ["/"],
    syntaxProbe: () => ({ ok: true }),
    dryRun: () => ({ exitCode: 0, output: "" }),
    flags: {},
    lock,
  };
}

/** A launcher file that exists, so check 1 reads it. */
let launcher: string | null = null;
function launcherPath(): string {
  if (launcher === null) {
    const dir = mkdtempSync(join(tmpdir(), "specstride-launcher-"));
    launcher = join(dir, "launcher");
    writeFileSync(launcher, "// launcher\n");
  }
  return launcher;
}

test("check 6 attaches on a held lock, refuses stale and foreign, passes on free", () => {
  const held = checkRunDirectoryFree(
    contextWith(lockStateOfProbe(outcomeOf("held-live", { owner: ownerOf(5, "run-h") }))),
  );
  assert.equal(held.status, "fail");
  assert.equal(held.reason, "already-running");
  assert.match(held.detail ?? "", /run=run-h/);

  const stale = checkRunDirectoryFree(
    contextWith(
      lockStateOfProbe(outcomeOf("stale-owner-dead", { owner: ownerOf(6, "run-s") })),
    ),
  );
  assert.equal(stale.status, "fail");
  assert.equal(stale.reason, "stale-lock");
  assert.match(stale.detail ?? "", /unlock --stale/);

  const foreign = checkRunDirectoryFree(
    contextWith({ state: "foreign", owner: "orchestrator", runId: "run-f" }),
  );
  assert.equal(foreign.status, "fail");
  assert.equal(foreign.reason, "foreign-lock");

  const free = checkRunDirectoryFree(contextWith({ state: "free" }));
  assert.equal(free.status, "pass");
});

test("the full check order attaches on a held lock and refuses on a stale one", () => {
  const heldResult = runLaunchChecks(
    contextWith(lockStateOfProbe(outcomeOf("held-live", { owner: ownerOf(5, "run-h") }))),
  );
  assert.equal(heldResult.decision, "attach");
  assert.equal(heldResult.reason, "already-running");

  const staleResult = runLaunchChecks(
    contextWith(lockStateOfProbe(outcomeOf("stale-owner-dead", { owner: ownerOf(6, "run-s") }))),
  );
  assert.equal(staleResult.decision, "refuse");
  assert.equal(staleResult.reason, "stale-lock");
});

test("the two new reasons are rows of the closed set of row 13", () => {
  for (const reason of ["already-running", "stale-lock", "foreign-lock"]) {
    assert.ok(isLaunchCheckRefusal(reason), `${reason} is a launch-check refusal`);
  }
  const outcomes: LaunchCheckOutcome[] = runLaunchChecks(
    contextWith({ state: "foreign" }),
  ).checks;
  assert.equal(outcomes.find((one) => one.name === "run-directory-free")?.reason, "foreign-lock");
});
