/**
 * T070 — CT-109-44, the second-form part of the conformance suite of EP-02,
 * at contract level (F109-FR-044; case HC-09).
 *
 * A fake binary that declares a read-only sandbox passes with the
 * confirmation of the read denial and is refused without it; its try to write
 * and its try to reach the network are recorded as refused.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  FAKE_BINARY,
  WITHHELD_LOCATIONS,
  declareReadOnlySandboxScript,
  judgeSecondFormRun,
  runSandboxedCritic,
  withheldProbePaths,
} from "./second-form.ts";
import { existsSync as fakeBinaryExists } from "node:fs";

test("CT-109-44: the fake binary of the suite is present and executable", () => {
  assert.equal(fakeBinaryExists(FAKE_BINARY), true, FAKE_BINARY);
});

test("CT-109-44: with the confirmation the call record proves the second form", async () => {
  const root = mkdtempSync(join(tmpdir(), "specstride-ep02-form2-"));
  const withheldPaths = withheldProbePaths(root);
  const writePath = join(root, "act.txt");
  // A free TCP port that is closed: the reach for the network is refused.
  const netPort = 1;
  const run = await runSandboxedCritic(
    declareReadOnlySandboxScript({ withheldPaths, netPort, writePath }),
  );
  assert.equal(run.exitCode, 0);
  // Every withheld read is refused by the declared sandbox...
  assert.equal(run.reads.length, WITHHELD_LOCATIONS.length);
  assert.ok(run.reads.every((read) => !read.ok));
  // ...and the reach for the network is refused.
  assert.equal(run.nets.length, 1);
  assert.equal(run.nets[0].ok, false);

  const verdict = judgeSecondFormRun(
    run,
    {
      sandboxMode: "read-only",
      networkOff: true,
      confirmed: true,
      deniedLocations: [...WITHHELD_LOCATIONS],
    },
    { write: true, network: true },
  );
  assert.equal(verdict.accepted, true);
  if (verdict.accepted) {
    assert.equal(verdict.proofKind, "read-only-sandbox");
    assert.deepEqual([...verdict.refusedActs], ["write", "network"]);
  }
});

test("CT-109-44: without the confirmation the call is refused with critic_not_toolless", async () => {
  const root = mkdtempSync(join(tmpdir(), "specstride-ep02-form2-"));
  const run = await runSandboxedCritic(
    declareReadOnlySandboxScript({
      withheldPaths: withheldProbePaths(root),
      netPort: 1,
      writePath: join(root, "act.txt"),
    }),
  );
  assert.equal(run.exitCode, 0);
  const verdict = judgeSecondFormRun(
    run,
    { sandboxMode: "read-only", networkOff: true, confirmed: false, deniedLocations: [] },
    { write: true, network: true },
  );
  assert.equal(verdict.accepted, false);
  if (!verdict.accepted) {
    assert.equal(verdict.failure, "critic_not_toolless");
    assert.match(verdict.reason, /no confirmation/);
  }
  // The write and the network attempts are still recorded as refused.
  assert.deepEqual([...verdict.refusedActs], ["write", "network"]);
});

test("CT-109-44: a write that lands and a reachable network are recorded as refused", () => {
  const root = mkdtempSync(join(tmpdir(), "specstride-ep02-form2-"));
  const writePath = join(root, "act.txt");
  // A sandbox that holds nothing: the read of a withheld path succeeds, the
  // write lands — the call record cannot prove the second form.
  const run = {
    exitCode: 0,
    stdout: "",
    reads: [{ action: "read" as const, path: writePath, ok: false }],
    nets: [{ action: "net" as const, host: "127.0.0.1", port: 1, ok: false }],
    wrote: true,
  };
  const verdict = judgeSecondFormRun(
    run,
    {
      sandboxMode: "none",
      networkOff: true,
      confirmed: true,
      deniedLocations: [...WITHHELD_LOCATIONS],
    },
    { write: true, network: true },
  );
  assert.equal(verdict.accepted, false);
  if (!verdict.accepted) {
    assert.equal(verdict.failure, "critic_not_toolless");
    assert.match(verdict.reason, /read-only sandbox mode/);
  }
  assert.ok(verdict.refusedActs.includes("write"));
  assert.ok(verdict.refusedActs.includes("network"));
  assert.equal(existsSync(writePath), false);
});
