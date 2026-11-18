/**
 * F153-FR-048 — a pin record that cannot be read for a reason other than its
 * absence is a failure of the pin step: no block and the warning
 * `W9 pin load skipped`, never a silent absence.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { pinStepBeforeCall } from "../../src/critic-input/pins/block.ts";
import { nodeFileReader } from "../../../runtime/src/ports/critic-input-files.ts";

test("the node reader: absence is undefined, a directory is an error", () => {
  const root = mkdtempSync(join(tmpdir(), "pins-read-"));
  try {
    const reader = nodeFileReader();
    assert.equal(reader.read(join(root, "absent.json"), 0, 10), undefined);
    mkdirSync(join(root, "dir"));
    assert.throws(() => reader.read(join(root, "dir"), 0, 10), /EISDIR/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the pin step warns when the record path is a directory", () => {
  const root = mkdtempSync(join(tmpdir(), "pins-read-"));
  try {
    const recordPath = join(root, "verdict-pins.json");
    mkdirSync(recordPath);
    const step = pinStepBeforeCall({
      reader: nodeFileReader(),
      phase: 1,
      recordPath,
      priorityPaths: [],
      workdir: root,
    });
    assert.equal(step.block, "");
    assert.equal(step.hash, "");
    assert.ok(step.warning?.startsWith("W9 pin load skipped"), String(step.warning));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
