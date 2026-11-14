/**
 * CT-152-13 — the block record is written atomically to the control plane
 * before anything of the next attempt starts (F152-FR-013; data-model.md E1).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { atomicWrite } from "@specstride/kernel/atomic-write";
import {
  blockRecordPath,
  writeBlockRecord,
  readBlockRecord,
} from "../src/post-approval/commit-gate.ts";

function record() {
  return {
    schema: "specstride.commit-gate-block/1" as const,
    feature: "152-commit-backpressure",
    phase: 3,
    ordinal: 2,
    runId: "run-1",
    engineStartId: "e1",
    verdictId: "v-approved-1",
    hits: [{ rule: "cg-bearer", file: "src/a.ts", line: 3 }],
    hitsOmitted: 0,
    signature: "a".repeat(64),
    ruleDataHash: "b".repeat(64),
    nonce: "a1b2c3d4e5f60718",
    at: "2026-11-09T00:00:00Z",
    path: "pre-scan" as const,
  };
}

test("the block record: atomic write, right path, valid against the schema, nonce kept", async () => {
  const root = mkdtempSync(join(tmpdir(), "ct-152-13-"));
  try {
    const writes: { file: string; bytes: string }[] = [];
    const inControl = (path: string): string => join(root, path);
    const logical = await writeBlockRecord(record(), {
      atomicWrite: (file, bytes) => {
        writes.push({ file, bytes });
        mkdirSync(dirname(file), { recursive: true });
        atomicWrite(file, bytes);
      },
      inControl,
    });

    // The logical name is E1's; the write went through the atomic write port.
    assert.equal(logical, blockRecordPath(3, 2));
    assert.equal(logical, "commit-gate/phase3.2.block.json");
    assert.equal(writes.length, 1);
    assert.equal(writes[0]!.file, inControl(logical));

    // The file on disk is the record given, and nothing else (no match text).
    const text = readFileSync(join(root, logical), "utf8");
    const onDisk = JSON.parse(text) as Record<string, unknown>;
    assert.equal(onDisk.path, "pre-scan");
    assert.equal(onDisk.nonce, "a1b2c3d4e5f60718");
    assert.equal(onDisk.verdictId, "v-approved-1");
    assert.ok(!text.includes("src/a".slice(0, 0) + "\u0000"));

    // The record validates against specstride.commit-gate-block/1 (the reader).
    const read = await readBlockRecord(3, 2, {
      readControl: (path) =>
        existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null,
    });
    assert.ok(read !== null);
    assert.deepEqual(read.hits, [{ rule: "cg-bearer", file: "src/a.ts", line: 3 }]);

    // The kernel's atomic write leaves no temporary file behind.
    const dirEntries = statSync(join(root, "commit-gate"));
    assert.ok(dirEntries.isDirectory());
    const entries = readdirSync(join(root, "commit-gate"));
    assert.deepEqual(entries, ["phase3.2.block.json"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * T167 — what a kill between the writes left undone (F152-FR-013).
 * `stepsToCompleteABlock` reads the newest block record of the phase (the
 * top level of `commit-gate/` only) and reports whether the corrective
 * feedback and the counts of its ordinal are still missing. The counts of
 * ordinal k are present when the ledger shows `phaseAttemptOrdinal` ≥ k —
 * a ledger record carries `phase` and `attemptId` but no ordinal field.
 * ------------------------------------------------------------------ */

import { stepsToCompleteABlock } from "../src/post-approval/commit-gate.ts";

function controlOf(root: string) {
  return {
    readControl: (path: string) =>
      existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null,
  };
}

test("stepsToCompleteABlock: no block record is complete (T167)", async () => {
  const root = mkdtempSync(join(tmpdir(), "ct-152-13-t167-"));
  try {
    const steps = await stepsToCompleteABlock(1, {
      ...controlOf(root),
      readCounts: () => ({ phaseAttemptOrdinal: 0 }),
    });
    assert.deepEqual(steps, { complete: true });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("stepsToCompleteABlock: a block record with neither feedback nor counts asks for both (T167)", async () => {
  const root = mkdtempSync(join(tmpdir(), "ct-152-13-t167-"));
  try {
    // The records of ordinals 1 and 2: the reader walks the ordinals from 1.
    for (const ordinal of [1, 2]) {
      await writeBlockRecord(
        { ...record(), ordinal },
        {
          atomicWrite: (file, text) => {
            mkdirSync(dirname(file), { recursive: true });
            atomicWrite(file, text);
          },
          inControl: (path) => join(root, path),
        },
      );
    }
    const steps = await stepsToCompleteABlock(3, {
      ...controlOf(root),
      readCounts: () => ({ phaseAttemptOrdinal: 0 }),
    });
    assert.deepEqual(steps, {
      complete: false,
      ordinal: 2,
      writeFeedback: true,
      writeCounts: true,
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("stepsToCompleteABlock: feedback present, counts missing asks for the counts only (T167)", async () => {
  const root = mkdtempSync(join(tmpdir(), "ct-152-13-t167-"));
  try {
    for (const ordinal of [1, 2]) {
      await writeBlockRecord(
        { ...record(), ordinal },
        {
          atomicWrite: (file, text) => {
            mkdirSync(dirname(file), { recursive: true });
            atomicWrite(file, text);
          },
          inControl: (path) => join(root, path),
        },
      );
    }
    mkdirSync(
      dirname(join(root, "features", "152-commit-backpressure", "feedback", "phase3.2.md")),
      {
        recursive: true,
      },
    );
    writeFileSync(
      join(root, "features", "152-commit-backpressure", "feedback", "phase3.2.md"),
      "the corrective block",
    );
    const steps = await stepsToCompleteABlock(3, {
      ...controlOf(root),
      readCounts: () => ({ phaseAttemptOrdinal: 1 }),
    });
    assert.deepEqual(steps, {
      complete: false,
      ordinal: 2,
      writeFeedback: false,
      writeCounts: true,
    });
    // Ordinal 2 is counted once the ledger shows phaseAttemptOrdinal ≥ 2.
    const done = await stepsToCompleteABlock(3, {
      ...controlOf(root),
      readCounts: () => ({ phaseAttemptOrdinal: 2 }),
    });
    assert.deepEqual(done, { complete: true });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
