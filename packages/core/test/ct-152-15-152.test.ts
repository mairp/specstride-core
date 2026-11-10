/**
 * CT-152-15 — the block facts come from the records (F152-FR-013,
 * F152-FR-015).
 *
 * The facts a report reads about the blocks of a phase come from the block
 * records of the control plane and from nothing else: `readBlockRecord` reads
 * one record and returns `null` where the file does not exist, and
 * `blocksOfThePhase` counts the top-level records of the phase. A reset sets
 * the records aside by RENAME into `commit-gate/reset-<at>/`, after which no
 * record is read and none is counted.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  blocksOfThePhase,
  readBlockRecord,
  setAsideBlockRecords,
  type CommitGateControlPorts,
} from "../src/post-approval/commit-gate.ts";

/** A control plane over a temporary folder, with the ports of the module. */
function controlPlane(): { root: string; ports: CommitGateControlPorts; close: () => void } {
  const root = mkdtempSync(join(tmpdir(), "ct-152-15-"));
  const at = (path: string): string => join(root, path);
  const ports: CommitGateControlPorts = {
    readControl: (path) => (existsSync(at(path)) ? readFileSync(at(path), "utf8") : null),
    listControl: (dir) => (existsSync(at(dir)) ? readdirSync(at(dir)) : []),
    moveControl: (from, to) => renameSync(at(from), at(to)),
    makeDirectoryControl: (dir): void => {
      mkdirSync(at(dir), { recursive: true });
    },
  };
  return { root, ports, close: () => rmSync(root, { recursive: true, force: true }) };
}

let sequence = 0;

/** A valid block record (specstride.commit-gate-block/1). */
function blockRecord(phase: number, ordinal: number): Record<string, unknown> {
  sequence += 1;
  return {
    schema: "specstride.commit-gate-block/1",
    feature: "152-commit-backpressure",
    phase,
    ordinal,
    runId: `run-${String(sequence)}`,
    engineStartId: "e1",
    verdictId: `v-${String(sequence)}`,
    hits: [{ rule: "cg-bearer", file: "tasks.md", line: 3 }],
    hitsOmitted: 0,
    signature: ("b" + String(sequence).padStart(3, "0")).padEnd(16, "c").padEnd(64, "0"),
    ruleDataHash: "d".repeat(64),
    nonce: "a1b2c3d4e5f60718",
    at: "2026-11-09T00:00:00Z",
    path: "pre-scan",
  };
}

test("the block facts come from the records", async () => {
  const { root, ports, close } = controlPlane();
  try {
    const dir = join(root, "commit-gate");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "phase1.1.block.json"), JSON.stringify(blockRecord(1, 1)), "utf8");
    writeFileSync(
      join(dir, "phase1.2.block.json"),
      JSON.stringify({ ...blockRecord(1, 2), signature: "2".padStart(1, "0").padEnd(64, "a") }),
      "utf8",
    );

    const second = await readBlockRecord(1, 2, ports);
    assert.equal(second?.signature, "2".padEnd(64, "a"));
    assert.equal(await readBlockRecord(1, 3, ports), null);
    assert.equal(await blocksOfThePhase(1, ports), 2);

    await setAsideBlockRecords(ports, "2026-11-09T12-00-00");

    assert.equal(await readBlockRecord(1, 2, ports), null);
    assert.equal(await blocksOfThePhase(1, ports), 0);
    assert.ok(
      existsSync(join(dir, "reset-2026-11-09T12-00-00", "phase1.2.block.json")),
      "the records are set aside, by rename, filenames preserved",
    );
  } finally {
    close();
  }
});
