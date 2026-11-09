/**
 * A task that edits the feature's own documents can be approved: the engine
 * restores only the ticks of tasks.md after a pass (a note a pass wrote is
 * kept), and the critic sees the documents' change even when git ignores the
 * feature directory (150-host-hermes phase 10, rejected 3× on T074/T075).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isIgnored,
  keepTicksOf,
  snapshotSpecDocs,
  specDocsBlock,
  specDocsChange,
} from "../../src/engine/spec-docs.ts";

const BEFORE = [
  "## Phase 10: Polish",
  "- [x] T073 done earlier",
  "- [ ] T074 Record a deviation note in tasks.md",
  "- [ ] T075 Record the re-check in plan.md",
].join("\n");

test("after a pass the ticks are the engine's again, and the note the pass wrote stays", () => {
  const afterThePass = [
    "## Phase 10: Polish",
    "- [ ] T073 done earlier",
    "- [x] T074 Record a deviation note in tasks.md",
    "  - Deviation: SC-002 timed on the stub host only (no live Hermes).",
    "- [x] T075 Record the re-check in plan.md",
    "- [x] T999 a task the pass invented",
  ].join("\n");
  assert.equal(
    keepTicksOf(afterThePass, BEFORE),
    [
      "## Phase 10: Polish",
      "- [x] T073 done earlier",
      "- [ ] T074 Record a deviation note in tasks.md",
      "  - Deviation: SC-002 timed on the stub host only (no live Hermes).",
      "- [ ] T075 Record the re-check in plan.md",
      "- [x] T999 a task the pass invented",
    ].join("\n"),
  );
  assert.equal(keepTicksOf(BEFORE, BEFORE), BEFORE);
});

test("the critic's block shows each changed document as a diff labelled by its path; nothing changed, no block", () => {
  const dir = mkdtempSync(join(tmpdir(), "spec-docs-"));
  try {
    writeFileSync(join(dir, "plan.md"), "# Plan\n");
    writeFileSync(join(dir, "tasks.md"), BEFORE);
    const before = snapshotSpecDocs(dir);
    assert.equal(specDocsChange(dir, before, "specs/f"), "");
    assert.equal(specDocsBlock("", "specs/f"), "");
    writeFileSync(join(dir, "plan.md"), "# Plan\n\n## Post-design Constitution re-check\nH2 ok\n");
    writeFileSync(join(dir, "notes.md"), "new\n");
    const change = specDocsChange(dir, before, "specs/f");
    assert.match(change, /--- specs\/f\/plan\.md\n\+\+\+ specs\/f\/plan\.md/);
    assert.match(change, /\+## Post-design Constitution re-check/);
    assert.match(change, /--- specs\/f\/notes\.md \(new\)/);
    assert.doesNotMatch(change, /tasks\.md/);
    assert.match(specDocsBlock(change, "specs/f"), /specs\/f\/ is ignored by git/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an ignored feature directory is told apart from a tracked one", () => {
  const repo = mkdtempSync(join(tmpdir(), "spec-docs-git-"));
  try {
    spawnSync("git", ["init", "-q"], { cwd: repo });
    mkdirSync(join(repo, "specs", "f"), { recursive: true });
    mkdirSync(join(repo, "docs"), { recursive: true });
    writeFileSync(join(repo, ".gitignore"), "specs/\n");
    assert.equal(isIgnored(repo, join(repo, "specs", "f")), true);
    assert.equal(isIgnored(repo, join(repo, "docs")), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
