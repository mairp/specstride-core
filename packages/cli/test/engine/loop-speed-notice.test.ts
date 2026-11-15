/**
 * Phase 5 of feature 153, US1a — the notice reaches the next attempt
 * (T053), the hashed verification record does not move (T054), and no
 * critic sees the notice (T055), on the fixture of T043: a workspace whose
 * declared check fails and whose failing output holds two `FAILED ` lines.
 *
 * The fake of this file fails the gate on the FIRST attempt only (a counter
 * outside the workspace the engine never touches), so attempt 1 leaves the
 * red-gate notice and attempt 2 passes the gate and is approved — the run
 * ends, and the records it left are asserted here. The stub agents are the
 * helpers of `loop-speed-helpers.ts`; no paid or external model API is
 * called (F153-FR-060).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { canonicalRecordHash } from "@specstride/kernel/hasher";
import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { fixture } from "./loop-speed-helpers.ts";

const HEADING = "# Phase 1 deterministic verification gate rejected";
const ALPHA = "FAILED test_alpha - expected 1";
const BETA = "FAILED test_beta - expected 2";

/** The control root the engine of this fixture's workspace writes. */
function controlRoot(work: string): string {
  return join(process.env.HOME ?? "", ".specstride", "workspaces", workspaceIdOfWorkspace(work));
}

type Run = {
  readonly work: string;
  readonly control: string;
  readonly exitCode: number;
  readonly restore: () => void;
};

/**
 * The T043 fixture with a declared check that fails the gate on the first
 * run of THIS process only (the counter lives beside the workspace, never
 * inside it, so the engine's tree handling cannot reset it). `firstOutput`
 * is what the fake prints on that first run.
 */
function gateFailsOnce(firstOutput: readonly string[]): Run {
  const { dir, restore } = fixture({ verdicts: "APPROVED" });
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  const root = join(dir, "..");
  mkdirSync(join(root, "bin"), { recursive: true });
  const counter = join(root, "gate-runs.txt");
  const fake = join(root, "bin", "fail-once.cjs");
  writeFileSync(
    fake,
    `#!/usr/bin/env node
const fs = require("node:fs");
const C = ${JSON.stringify(counter)};
let n = 0; try { n = Number(fs.readFileSync(C, "utf8")); } catch {}
fs.writeFileSync(C, String(n + 1));
if (n < 1) {
${firstOutput.map((line) => `  console.log(${JSON.stringify(line)});`).join("\n")}
  process.exit(1);
}
process.exit(0);
`,
  );
  chmodSync(fake, 0o755);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "x", private: true, scripts: { test: "node ../bin/fail-once.cjs" } }, null, 2),
  );
  return { work: dir, control: controlRoot(dir), exitCode: -1, restore };
}

test("CT-153-16 the next attempt gets the notice", async () => {
  const run = gateFailsOnce([ALPHA, "ok between", BETA]);
  try {
    const exit = await runFeature({ argv: [], workdir: run.work });
    assert.equal(exit, 0, "attempt 2 passes the gate and the phase is approved");
    // The control-plane notice of attempt 1: the frame of F105-FR-006 with
    // the failing lines of the fake under its own heading.
    const notice = readFileSync(
      join(run.control, "features", "001-one", "set-aside", "phase1", "phase1.1.md"),
      "utf8",
    );
    assert.ok(notice.startsWith(`${HEADING}\n`));
    assert.ok(notice.includes(ALPHA));
    assert.ok(notice.includes(BETA));
    // The proposer prompt of attempt 2 carries the notice: both failing
    // lines reach the next attempt.
    const prompts = readFileSync(join(run.work, "prompts.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { role: string; prompt: string })
      .filter((entry) => entry.role === "proposer");
    assert.ok(prompts.length >= 2, "the engine ran a second proposer attempt");
    assert.ok(prompts[1].prompt.includes(ALPHA));
    assert.ok(prompts[1].prompt.includes(BETA));
    assert.ok(prompts[1].prompt.includes(HEADING));
  } finally {
    run.restore();
  }
});

test("CT-153-18 the record does not move", async () => {
  const rich = gateFailsOnce([ALPHA, "ok between", BETA]);
  let richRecord = "";
  try {
    assert.equal(await runFeature({ argv: [], workdir: rich.work }), 0);
    richRecord = readFileSync(
      join(rich.control, "features", "001-one", "verification", "phase1.1.json"),
      "utf8",
    );
  } finally {
    rich.restore();
  }
  // The same run with the fake's output replaced by one line: the record of
  // attempt 1 must be byte-identical (F153-FR-018).
  const thin = gateFailsOnce(["just one line of output"]);
  try {
    assert.equal(await runFeature({ argv: [], workdir: thin.work }), 0);
    const thinRecord = readFileSync(
      join(thin.control, "features", "001-one", "verification", "phase1.1.json"),
      "utf8",
    );
    assert.equal(thinRecord, richRecord);
    const record = JSON.parse(richRecord) as {
      exit_code: number;
      mode: string;
      roster: readonly { name: string; status: string }[];
      hash: string;
      summary?: unknown;
    };
    assert.equal(record.exit_code, 10);
    assert.equal(record.mode, "required");
    assert.deepEqual(record.roster, [{ name: "npm test", status: "failed" }]);
    assert.equal(
      record.hash,
      canonicalRecordHash({ exit_code: 10, mode: "required", roster: [{ name: "npm test", status: "failed" }] }),
    );
    assert.equal("summary" in record, false, "the record holds no summary field");
    assert.equal(JSON.stringify(record).includes(ALPHA), false);
  } finally {
    thin.restore();
  }
});

test("CT-153-19 no critic sees the notice", async () => {
  const run = gateFailsOnce([ALPHA, BETA]);
  try {
    assert.equal(await runFeature({ argv: [], workdir: run.work }), 0);
    const prompts = readFileSync(join(run.work, "prompts.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { role: string; prompt: string })
      .filter((entry) => entry.role === "critic");
    assert.ok(prompts.length >= 1, "the critic judged the approved attempt");
    for (const entry of prompts) {
      assert.ok(!entry.prompt.includes(ALPHA));
      assert.ok(!entry.prompt.includes(BETA));
      assert.ok(!entry.prompt.includes(HEADING));
    }
    void spawnSync;
  } finally {
    run.restore();
  }
});
