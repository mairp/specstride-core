/**
 * Phase 12 of feature 153, US4 — the verdict pins around the critic call
 * (F153-FR-048, F153-FR-049), on the fixture `critic-rejects-then-approves`:
 * attempt 1 is rejected naming only T004 as unmet, attempt 2 is approved. The
 * stub proposer of attempt 2 changes or deletes a backing file where the case
 * asks (`STUB_ATTEMPT2`). Both attempts run inside ONE `runFeature` call.
 * No paid or external model API is called (F153-FR-060). The stub `claude`
 * lives in the fixtures' `bin` directory, beside the other test doubles.
 */
import assert from "node:assert/strict";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { renderPinBlock } from "../../../core/src/critic-input/pins/block.ts";
import { readBackingEntries, MISSING_BACKING_DIGEST } from "../../../core/src/critic-input/pins/hash.ts";
import { nodeFileReader } from "../../../runtime/src/ports/critic-input-files.ts";
import { runFeature } from "../../src/engine/run-feature.ts";
import { fixture } from "./loop-speed-helpers.ts";

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "loop-speed", "critic-rejects-then-approves");
const PIN_BLOCK = "PREVIOUSLY CONFIRMED (W9 verdict pins)";

type Prompt = { readonly role: string; readonly prompt: string };

/** Run the fixture to its end; the options say what the proposer does in attempt 2. */
async function run(attempt2: string | undefined, beforeRun?: (home: string) => void) {
  const { dir, restore } = fixture({ verdicts: "APPROVED" });
  const home = join(dir, "..");
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  if (attempt2 === undefined) delete process.env.STUB_ATTEMPT2;
  else process.env.STUB_ATTEMPT2 = attempt2;
  mkdirSync(join(dir, "specs", "001-one"), { recursive: true });
  copyFileSync(join(FIXTURE, "tasks.md"), join(dir, "specs", "001-one", "tasks.md"));
  copyFileSync(
    join(FIXTURE, "..", "bin", "stub-critic-pins.mjs"),
    join(home, "bin", "claude"),
  );
  chmodSync(join(home, "bin", "claude"), 0o755);
  beforeRun?.(home);
  const stderr: string[] = [];
  const original = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;
  let exit: number;
  try {
    exit = await runFeature({ argv: [], workdir: dir });
  } finally {
    process.stderr.write = original;
  }
  const prompts: Prompt[] = readFileSync(join(dir, "prompts.jsonl"), "utf8")
    .split("\n")
    .filter((l) => l !== "")
    .map((l) => JSON.parse(l) as Prompt);
  const critics = prompts.filter((p) => p.role === "critic").map((p) => p.prompt);
  return { dir, home, exit, critics, stderr: stderr.join(""), restore };
}

/** The pin record file the engine keeps for the phase, wherever the control root is. */
function pinRecordUnder(root: string): string | undefined {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return undefined;
  }
  for (const e of entries) {
    const p = join(root, e.name);
    if (e.isFile() && e.name === "verdict-pins.json") return p;
    if (e.isDirectory()) {
      const r = pinRecordUnder(p);
      if (r !== undefined) return r;
    }
  }
  return undefined;
}

test("CT-153-48 a confirmation is carried", async () => {
  const r = await run(undefined);
  try {
    assert.equal(r.exit, 0);
    assert.equal(r.critics.length, 2, "two critic calls");
    assert.ok(!r.critics[0]!.includes(PIN_BLOCK), "attempt 1 has no pin block");
    const second = r.critics[1]!;
    const at = second.indexOf(PIN_BLOCK);
    assert.ok(at >= 0, "attempt 2 holds the pin block");
    const block = second.slice(at, second.indexOf("# End of the data", at));
    assert.match(block, /T001/);
    assert.match(block, /T002/);
    assert.doesNotMatch(block, /T004/);
  } finally {
    r.restore();
  }
});

test("CT-153-48 a changed file drops the pins", async () => {
  const r = await run("change-a");
  try {
    assert.equal(r.exit, 0);
    assert.equal(r.critics.length, 2);
    assert.ok(!r.critics[1]!.includes(PIN_BLOCK), "the backing hash changed, no pin is shown");
  } finally {
    r.restore();
  }
});

test("CT-153-48 a deleted file drops the pins", async () => {
  const r = await run("delete-b");
  try {
    assert.equal(r.exit, 0);
    assert.equal(existsSync(join(r.dir, "src", "b.ts")), false, "the stub deleted src/b.ts in attempt 2");
    assert.ok(!r.critics[1]!.includes(PIN_BLOCK), "MISSING changes the backing hash, no pin is shown");
    const deleted = readBackingEntries(nodeFileReader(), ["src/a.ts", "src/b.ts", "src/c.ts"], r.dir).find(
      (e) => e.path === "src/b.ts",
    );
    assert.equal(deleted?.digest, MISSING_BACKING_DIGEST, "the deleted file hashes as MISSING");
  } finally {
    r.restore();
  }
});

test("CT-153-48 APPROVED removes the pins", async () => {
  const r = await run(undefined);
  try {
    assert.equal(r.exit, 0);
    assert.ok(existsSync(join(r.home, "pins-at-critic-2.json")), "a record stood at the second critic call");
    assert.equal(pinRecordUnder(join(r.home, ".specstride")), undefined, "no pin record stands after APPROVED");
  } finally {
    r.restore();
  }
});

test("CT-153-48 MALFORMED writes nothing", async () => {
  process.env.STUB_CRITIC = "malformed";
  try {
    const r = await run(undefined);
    try {
      assert.notEqual(r.exit, 0, "a critic with no verdict line never approves");
      assert.ok(r.critics.length >= 2, "the critic was called more than once");
      assert.equal(pinRecordUnder(join(r.home, ".specstride")), undefined, "no pin record was written");
      assert.ok(!r.critics[1]!.includes(PIN_BLOCK));
    } finally {
      r.restore();
    }
  } finally {
    delete process.env.STUB_CRITIC;
  }
});

test("CT-153-48 a load failure only warns", async () => {
  const r = await run("pins-dir");
  try {
    assert.equal(r.exit, 0, "the critic was still called and approved");
    assert.equal(r.critics.length, 2);
    assert.ok(!r.critics[1]!.includes(PIN_BLOCK));
    const lines = r.stderr.split("\n").filter((l) => l.startsWith("W9 pin load skipped"));
    assert.equal(lines.length, 1, `exactly one warning line, got: ${r.stderr}`);
  } finally {
    r.restore();
  }
});

test("CT-153-49 a pin carries three things", async () => {
  const r = await run(undefined);
  try {
    const record = JSON.parse(readFileSync(join(r.home, "pins-at-critic-2.json"), "utf8")) as Record<string, unknown>;
    assert.deepEqual(Object.keys(record).sort(), ["confirmed", "hash", "phase", "schema"]);
    assert.deepEqual(record.confirmed, ["T001", "T002"]);
    const [first, second] = [r.critics[0]!, r.critics[1]!];
    assert.ok(
      second.includes(renderPinBlock(new Set(["T001", "T002"]))),
      "the block is the as-is literal with the two ids and nothing else in it",
    );
    assert.doesNotMatch(second, /npm test|FAILED|red-gate|rejected the/i, "no check output, no feedback");
    const tail = (text: string) =>
      text.slice(text.indexOf("# End of the data")).replace(/VERDICT [0-9a-f]+/g, "VERDICT N").replace(/attempt:1:\d+:grounding/, "attempt:1:K:grounding");
    assert.equal(tail(second), tail(first), "the demand and the unmet-report instruction are unchanged");
    assert.match(tail(second), /<task id>: UNMET/, "the critic is still asked for a line per task");
  } finally {
    r.restore();
  }
});
