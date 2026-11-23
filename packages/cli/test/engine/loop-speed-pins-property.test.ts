/**
 * Phase 12 of feature 153 — F153-SC-007, pins never lie. A seeded generator
 * drives 200 sequences of edits to three backing files between two critic
 * calls; `pinStepBeforeCall`, `updatePinsAfterVerdict` and `clearPins` are
 * called directly on temporary files. A pin is shown if and only if no
 * backing file changed, and none is shown after `clearPins` and removal.
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  clearPins,
  pinStepBeforeCall,
  updatePinsAfterVerdict,
} from "../../../core/src/critic-input/pins/block.ts";
import { verdictPinsRecordPath } from "../../../core/src/critic-input/pins/store.ts";
import { nodeFileReader } from "../../../runtime/src/ports/critic-input-files.ts";

/** A small seeded generator (mulberry32): the sequences are the same every run. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("F153-SC-007 pins never lie", () => {
  const next = seeded(153);
  const reader = nodeFileReader();
  const names = ["src/a.ts", "src/b.ts", "src/c.ts"];
  const ids = new Set(["T001", "T002", "T004"]);
  let shown = 0;
  let notShown = 0;
  for (let run = 0; run < 200; run += 1) {
    const root = mkdtempSync(join(tmpdir(), "pins-property-"));
    try {
      mkdirSync(join(root, "src"));
      for (const n of names) writeFileSync(join(root, n), `before ${n}\n`);
      const recordPath = verdictPinsRecordPath(join(root, "control", "phases"), 1);
      const first = pinStepBeforeCall({
        reader,
        phase: 1,
        recordPath,
        priorityPaths: names,
        workdir: root,
      });
      assert.equal(first.warning, undefined);
      assert.equal(first.block, "", "nothing is pinned before the first verdict");
      updatePinsAfterVerdict({
        verdict: "REJECTED",
        phase: 1,
        recordPath,
        allIds: ids,
        reply: "T004: UNMET missing",
        hash: first.hash,
        reader,
        findCriterionIds: (text) => [...ids].filter((id) => text.includes(id)),
      });
      // random edits between the two calls: change, delete or leave each file
      let edited = false;
      for (const n of names) {
        const pick = next();
        if (pick < 0.2) {
          writeFileSync(join(root, n), `after ${String(next())}\n`);
          edited = true;
        } else if (pick < 0.3) {
          rmSync(join(root, n));
          edited = true;
        }
      }
      const second = pinStepBeforeCall({
        reader,
        phase: 1,
        recordPath,
        priorityPaths: names,
        workdir: root,
      });
      if (edited) {
        assert.equal(second.block, "", `run ${run}: a file changed, so no pin may be shown`);
        notShown += 1;
      } else {
        assert.match(second.block, /T001, T002/, `run ${run}: nothing changed, so the pins stand`);
        shown += 1;
      }
      // APPROVED: the record is cleared and removed; nothing is shown after it
      clearPins(recordPath, 1);
      rmSync(recordPath, { force: true });
      assert.equal(existsSync(recordPath), false);
      const third = pinStepBeforeCall({
        reader,
        phase: 1,
        recordPath,
        priorityPaths: names,
        workdir: root,
      });
      assert.equal(third.block, "", `run ${run}: no pin after APPROVED`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
  // not vacuous: both branches were exercised
  assert.ok(
    shown > 20 && notShown > 20,
    `both branches ran (shown ${shown}, not shown ${notShown})`,
  );
});
