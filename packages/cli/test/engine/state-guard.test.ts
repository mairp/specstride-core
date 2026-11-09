/**
 * The guard of the engine's state under `<workdir>/.specstride/`: a pass that
 * deletes the engine's records (on 2026-11-09 a proposer ran `rm -rf
 * .specstride` while its run was live) gets them put back, without the guard
 * ever overwriting a record the engine wrote during the pass, and without it
 * resurrecting the files a pass is asked to rewrite (evidence, checkpoint).
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  restoreMissingState,
  snapshotWorkspaceState,
  stateRestoredNote,
} from "../../src/engine/state-guard.ts";

function workspace(): { dir: string; state: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "state-guard-"));
  const state = join(dir, ".specstride");
  const put = (rel: string, text: string): void => {
    mkdirSync(join(state, rel, ".."), { recursive: true });
    writeFileSync(join(state, rel), text);
  };
  put("workspace.json", '{"workspaceId":"w"}');
  put("active", '{"launchId":"launch-a"}');
  put("lock/owner.json", '{"pid":1}');
  put("launches/launch-a/launch.json", '{"launchId":"launch-a"}');
  put("features/f1/evidence/GATE1-EVIDENCE.md", "old evidence");
  put("features/f1/outbox/u1.checkpoint.json", "{}");
  return { dir, state, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const EXCLUDE = ["features/f1/evidence", "features/f1/outbox"];

test("after `rm -rf .specstride` every snapshotted record is put back, byte for byte", () => {
  const ws = workspace();
  try {
    const snap = snapshotWorkspaceState(ws.state, { exclude: EXCLUDE });
    rmSync(ws.state, { recursive: true, force: true });
    const restored = restoreMissingState(snap);
    assert.deepEqual(restored, [
      "active",
      "launches/launch-a/launch.json",
      "lock/owner.json",
      "workspace.json",
    ]);
    assert.equal(readFileSync(join(ws.state, "lock", "owner.json"), "utf8"), '{"pid":1}');
    assert.equal(
      existsSync(join(ws.state, "features", "f1", "evidence", "GATE1-EVIDENCE.md")),
      false,
      "evidence is not resurrected",
    );
    assert.equal(
      existsSync(join(ws.state, "features", "f1", "outbox")),
      false,
      "a checkpoint is not resurrected",
    );
  } finally {
    ws.cleanup();
  }
});

test("a record that exists after the pass is never overwritten; nothing missing, nothing restored", () => {
  const ws = workspace();
  try {
    const snap = snapshotWorkspaceState(ws.state, { exclude: EXCLUDE });
    writeFileSync(join(ws.state, "active"), '{"launchId":"launch-b"}'); // the engine moved on during the pass
    assert.deepEqual(restoreMissingState(snap), []);
    assert.equal(readFileSync(join(ws.state, "active"), "utf8"), '{"launchId":"launch-b"}');
  } finally {
    ws.cleanup();
  }
});

test("big files and symbolic links are not snapshotted; an absent root gives an empty snapshot", () => {
  const ws = workspace();
  try {
    writeFileSync(join(ws.state, "big.log"), "x".repeat(2048));
    symlinkSync(join(ws.state, "workspace.json"), join(ws.state, "link.json"));
    const snap = snapshotWorkspaceState(ws.state, { fileBytes: 1024, exclude: EXCLUDE });
    assert.equal(snap.files.has("big.log"), false);
    assert.equal(snap.files.has("link.json"), false);
    assert.equal(snap.files.has("workspace.json"), true);
    assert.equal(snapshotWorkspaceState(join(ws.dir, "absent")).files.size, 0);
  } finally {
    ws.cleanup();
  }
});

test("the note to the next pass names what was deleted and the rule", () => {
  const note = stateRestoredNote(["active", "lock/owner.json"]);
  assert.match(note, /deleted the engine's own state/);
  assert.match(note, /\.specstride\/active, \.specstride\/lock\/owner\.json/);
  assert.match(note, /never delete, move or rewrite anything under it/);
});
