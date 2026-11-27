/**
 * T140 — THE PHASE TREES ARE OPAQUE AND LEAK NOTHING (feature 154, US6;
 * F154-FR-069): the tree path of a candidate phase is made under the tree
 * store's worker root — NOT under the workspace and NOT under the control
 * plane — and names nothing of the phase (no number, no slug), and the
 * critic's input for phase 2 holds nothing of phase 3's tree: neither its
 * path nor its worker root appears, and the text passes the path-leak audit
 * of F142-FR-056 (no hit of worker-root, tree-store, control-plane, token).
 */
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { pinEngineEnv } from "./helpers/fixture.ts";
import {
  placesOfThePhaseTreeStore,
  phaseQueueDirectoryOf,
  readQueueEntry,
} from "../../src/engine/phase-trees.ts";
import { THE_AUDITS_READ, pathLeaks } from "../../../core/src/parallel/audits.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The task list OF THE PHASES FIXTURE (T132): three phases, 2 and 3 declared. */
const FIXTURE_TASKS = readFileSync(
  join(HERE, "../../../../tests/fixtures/154/phases/tasks.md"),
  "utf8",
);

/**
 * The stub `claude` that RECORDS EVERY PROMPT it is given, so the test can
 * audit what the critic of phase 2 was told.
 */
function stubThatRecords(log: string): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
fs.appendFileSync(${JSON.stringify(log)}, (critic ? "CRITIC\\n" : "PROPOSER\\n") + prompt + "\\n---8<---\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T00x judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T00x done\\n");
  const tasks = "specs/154-phases/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace(/- \\[ \\] (T00\\d)/g, "- [x] $1"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

function workspaceOfTheFixture(): {
  readonly dir: string;
  readonly promptLog: string;
  readonly restore: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), "specstride-pt-leak-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const promptLog = join(dir, "prompts.log");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "154-phases"), { recursive: true });
  writeFileSync(join(bin, "claude"), stubThatRecords(promptLog));
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, "specs", "154-phases", "tasks.md"), FIXTURE_TASKS);
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
    PHASES_PARALLEL: process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = "on";
  const restoreEnv = pinEngineEnv({ feature: "154-phases" });
  return {
    dir: work,
    promptLog,
    restore: () => {
      restoreEnv();
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.PHASES_PARALLEL === undefined) delete process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL;
      else process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = before.PHASES_PARALLEL;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test("the tree paths are opaque and the phase-2 critic input holds nothing of phase 3's tree", async () => {
  const ws = workspaceOfTheFixture();
  try {
    const controlRoot = controlRootOfWorkspace(ws.dir);
    const exit = await runFeature({ argv: [], workdir: ws.dir });
    assert.equal(exit, 0, `the run ended ${String(exit)}`);
    assert.equal(existsSync(phaseQueueDirectoryOf(controlRoot)), true, "no queue was written");
    const two = readQueueEntry(controlRoot, 2);
    const three = readQueueEntry(controlRoot, 3);
    assert.ok(two !== undefined && three !== undefined);
    assert.notEqual(two.treePath, three.treePath, "the two trees share one path");

    // THE OPAQUE PATH: not under the workspace, not under the control plane,
    // and naming nothing of the phase — no number, no slug, no `phase-`.
    for (const [phase, entry] of [
      [2, two],
      [3, three],
    ] as const) {
      assert.ok(!entry.treePath.startsWith(ws.dir), `phase ${phase}'s tree is under the workspace`);
      assert.ok(
        !entry.treePath.startsWith(controlRoot),
        `phase ${phase}'s tree is under the control plane`,
      );
      assert.ok(
        !entry.treePath.includes("154-phases"),
        `phase ${phase}'s tree path names the slug`,
      );
      assert.ok(
        !/phase-?\d/i.test(entry.treePath),
        `phase ${phase}'s tree path names the phase: ${entry.treePath}`,
      );
      assert.ok(existsSync(entry.treePath), `phase ${phase}'s tree was never made`);
    }

    // THE CRITIC'S INPUT OF PHASE 2: the third recorded critic prompt (one
    // per phase, in phase order).
    const log = readFileSync(ws.promptLog, "utf8");
    const criticPrompts = log.split("---8<---\n").filter((one) => one.startsWith("CRITIC\n"));
    assert.ok(
      criticPrompts.length >= 3,
      `only ${criticPrompts.length} critic prompts were recorded`,
    );
    const phaseTwoCritic = criticPrompts[1];

    // NOTHING OF PHASE 3'S TREE: not its path, not its worker root.
    assert.ok(
      !phaseTwoCritic.includes(three.treePath),
      "the phase-2 critic saw phase 3's tree path",
    );
    assert.ok(
      !phaseTwoCritic.includes(dirname(three.treePath)),
      "the phase-2 critic saw phase 3's worker root",
    );

    // AND THE PATH-LEAK AUDIT OF F142-FR-056 PASSES: the phase-2 critic
    // prompt, audited against the run's real worker root, tree store,
    // control plane and run token, holds no hit.
    const places = placesOfThePhaseTreeStore({ controlRoot, runId: two.runId });
    const leaks = pathLeaks(
      {
        workerId: "phase-2",
        treeId: two.treeId,
        source: THE_AUDITS_READ,
        paths: [{ path: "critic-prompt", kind: "added", text: phaseTwoCritic }],
      },
      {
        workerRoot: dirname(two.treePath),
        treeStore: places.store,
        controlPlane: controlRoot,
        workerToken: two.runId,
      },
    );
    assert.deepEqual(leaks, [], "the phase-2 critic prompt leaked a run path");
  } finally {
    ws.restore();
  }
});
