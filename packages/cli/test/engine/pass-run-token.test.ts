/**
 * REGRESSION — the proposer pass carries the run token in its environment.
 *
 * The engine records every pass in flight under `sha256(runId)`
 * (`run:<runId>:pass-in-flight`), and `stop --now` ends a recorded pass only
 * after `signal-owned` reads `SPECSTRIDE_RUN_TOKEN` back from the live
 * process's environment and matches that hash. The pass was spawned WITHOUT
 * the token, so `stop --now` always printed "recorded pass (pid N) is not
 * running — nothing to kill" about a live pass and the stop waited for the
 * next boundary. Pinned over a stub `dsh` that writes what it received.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { passOnDsh } from "../../src/engine/run-feature.ts";
import { hashOfToken, RUN_TOKEN_VAR } from "../../src/run-control/signal-owned.ts";

test("a dsh pass receives SPECSTRIDE_RUN_TOKEN whose hash is the registry's runTokenHash", async () => {
  const root = mkdtempSync(join(tmpdir(), "pass-run-token."));
  const bin = join(root, "bin");
  const work = join(root, "work");
  const seen = join(root, "seen");
  mkdirSync(bin);
  mkdirSync(work);
  writeFileSync(
    join(bin, "dsh"),
    `#!/bin/sh\nprintf '%s' "$${RUN_TOKEN_VAR}" > "${seen}"\nexit 0\n`,
  );
  chmodSync(join(bin, "dsh"), 0o755);
  const savedPath = process.env.PATH;
  process.env.PATH = `${bin}:${savedPath ?? ""}`;
  try {
    const runId = "run-7716ec09-a9e1-42e6-87fd-4693677b5486";
    await passOnDsh("provider/model", "prompt", work, () => undefined, 30_000, runId);
    const token = readFileSync(seen, "utf8");
    assert.equal(token, runId);
    // The engine's registry hash (run-feature.ts) and the stop's check agree.
    assert.equal(hashOfToken(token), createHash("sha256").update(runId).digest("hex"));
  } finally {
    process.env.PATH = savedPath;
    rmSync(root, { recursive: true, force: true });
  }
});
