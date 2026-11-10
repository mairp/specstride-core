/**
 * A refused START names itself on the product output (F101-FR-032; found in
 * the field 2026-11-10): a run whose specification shows every task of a phase
 * ticked while no approval record of it verifies ends exit 3 BEFORE the loop,
 * and the operator sees one line that names the refusal, the phases and the
 * `state export` / `state import` / `state adopt` remedy — never a bare
 * `[LOOP]` + `[DIGEST exit=3]` with no cause.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";

const STUB = join(
  import.meta.dirname,
  "..",
  "fixtures",
  "commit-gate",
  "secret-every-attempt",
  "stub-claude",
);

test("CT-101-15 (CLI): a refused start prints the refusal line, then exits 3", async () => {
  const dir = mkdtempSync(join(tmpdir(), "specstride-refused-start-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  // Every task of phase 1 ticked, and no approval record anywhere: the
  // refusal of F101-FR-032.
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [x] T001 Do it\n",
  );
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: 'node -e ""' } }));
  copyFileSync(STUB, join(bin, "claude"));
  chmodSync(join(bin, "claude"), 0o755);
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    FEATURE: process.env.SPECSTRIDE_FEATURE,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_FEATURE = "001-one";
  // The stub is never called: the refusal ends the start before the loop.
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    if (typeof chunk === "string") chunks.push(chunk);
    return originalWrite(chunk as string);
  }) as typeof process.stdout.write;
  try {
    const exit = await runFeature({ argv: [], workdir: work });
    assert.equal(exit, 3);
    const out = chunks.join("");
    const refused = out.split("\n").filter((line) => line.includes("refused ("));
    assert.deepEqual(refused, [
      "[001-one] refused (ticked-phases-without-an-approval-record): " +
        "the specification shows every task of phase 1 ticked, and no approval record of " +
        "that phase verifies. The run is refused so that ticks alone cannot pass for " +
        "approved work. Move the control plane with `state export` and `state import`, " +
        "or take over the control plane of this working tree with `state adopt` " +
        "(F101-FR-032, F100-FR-059).",
    ]);
    // The refusal comes BEFORE the loop line, so the cause is read first.
    assert.ok(out.indexOf("refused (") < out.indexOf("[LOOP]"));
  } finally {
    process.stdout.write = originalWrite;
    process.env.HOME = before.HOME;
    process.env.PATH = before.PATH;
    if (before.FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
    else process.env.SPECSTRIDE_FEATURE = before.FEATURE;
    if (before.PROPOSER === undefined) delete process.env.SPECSTRIDE_PROPOSER;
    else process.env.SPECSTRIDE_PROPOSER = before.PROPOSER;
    if (before.CRITIC === undefined) delete process.env.SPECSTRIDE_CRITIC;
    else process.env.SPECSTRIDE_CRITIC = before.CRITIC;
    rmSync(dir, { recursive: true, force: true });
  }
});
