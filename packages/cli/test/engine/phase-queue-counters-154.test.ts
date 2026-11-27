/**
 * T139 — THE OUTER COUNTER OF THE RUN IS NOT SPENT BY THE WORKED-AT-ONCE
 * PHASES, AND EACH PHASE'S ATTEMPT NUMBERS SURVIVE A RESUME AND A RELAUNCH
 * (feature 154, US6; F154-FR-060): with `loop.phases.parallel` on, phases 2
 * and 3 of the fixture both stand at attempt 1 when the run is done — the
 * parallel work of one did not advance the other, and nothing on the control
 * plane carries an attempt above the phase's own — while the attempt number
 * a REJECTION advances lives on the persisted queue entry, so a coordinator
 * built fresh over the same control root (a resume) and another one after it
 * (a relaunch) read the same advanced attempt and hold the phase at the head
 * for repair (PQ-2 keeps the dependent waiting).
 */
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
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
import { admissionOf } from "../../../core/src/phase-queue/validation-queue.ts";
import {
  coordinatorOf,
  phaseQueueDirectoryOf,
  readQueueEntry,
  type PhaseDeclaration,
} from "../../src/engine/phase-trees.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The task list OF THE PHASES FIXTURE (T132): three phases, 2 and 3 declared. */
const FIXTURE_TASKS = readFileSync(
  join(HERE, "../../../../tests/fixtures/154/phases/tasks.md"),
  "utf8",
);

/** The stub `claude` of the run-feature tests: an honest phase is approved. */
const STUB = `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
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

function workspaceOfTheFixture(): { readonly dir: string; readonly restore: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "specstride-pq-counters-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "154-phases"), { recursive: true });
  writeFileSync(join(bin, "claude"), STUB);
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

const DECLARATIONS: readonly PhaseDeclaration[] = [
  { phase: 1, dependsOn: [] },
  { phase: 2, dependsOn: [1], writeScope: ["packages/a/"] },
  { phase: 3, dependsOn: [1], writeScope: ["packages/b/"] },
];

test("worked-at-once phases spend no outer counter; attempt numbers survive a resume and a relaunch", async () => {
  const ws = workspaceOfTheFixture();
  try {
    const controlRoot = controlRootOfWorkspace(ws.dir);
    const exit = await runFeature({ argv: [], workdir: ws.dir });
    assert.equal(exit, 0, `the run ended ${String(exit)}`);
    assert.equal(existsSync(phaseQueueDirectoryOf(controlRoot)), true, "no queue was written");

    // NO OUTER COUNTER SPENT: both candidate phases stand at attempt 1 with
    // one gate each — the parallel work of phase 3 did not advance phase 2's
    // attempt or its gate guard, and no entry on the control plane carries
    // an attempt above its phase's own.
    const two = readQueueEntry(controlRoot, 2);
    const three = readQueueEntry(controlRoot, 3);
    assert.ok(two !== undefined && three !== undefined);
    assert.equal(two.attempt, 1, "phase 2's attempt was spent by the outer loop");
    assert.equal(three.attempt, 1, "phase 3's attempt was spent by the outer loop");
    assert.equal(two.gatedAttempt, 1);
    assert.equal(three.gatedAttempt, 1);
    const attemptsOnDisk = readdirSync(phaseQueueDirectoryOf(controlRoot))
      .map(
        (one) =>
          JSON.parse(readFileSync(join(phaseQueueDirectoryOf(controlRoot), one), "utf8")) as {
            attempt: number;
          },
      )
      .map((one) => one.attempt);
    assert.deepEqual(attemptsOnDisk.sort(), [1, 1], "an outer counter leaked into the queue");

    // THE RESUME: a coordinator built FRESH over the same control root reads
    // the persisted state; its rejection of phase 2 advances THAT PHASE'S
    // attempt on the persisted entry (attempt+1, gate guard cleared).
    const resumed = coordinatorOf({
      on: true,
      declarations: DECLARATIONS,
      feature: "154-phases",
      runId: "run-resume",
      controlRoot,
      workspace: ws.dir,
      taskListPath: "specs/154-phases/tasks.md",
    });
    assert.ok(resumed !== null);
    resumed.rejected(2);
    const repaired = readQueueEntry(controlRoot, 2);
    assert.ok(repaired !== undefined);
    assert.equal(repaired.attempt, 2, "the rejection did not advance the phase's own attempt");
    assert.equal(repaired.gatedAttempt, undefined);
    assert.equal(
      readQueueEntry(controlRoot, 3)?.attempt,
      1,
      "the rejection spent phase 3's attempt too",
    );

    // THE RELAUNCH: a THIRD coordinator, fresh again, reads the SAME advanced
    // attempt, and the queue holds the rejected phase at the head (the
    // repair) with the dependent held by PQ-2's wait.
    const relaunched = coordinatorOf({
      on: true,
      declarations: DECLARATIONS,
      feature: "154-phases",
      runId: "run-relaunch",
      controlRoot,
      workspace: ws.dir,
      taskListPath: "specs/154-phases/tasks.md",
    });
    assert.ok(relaunched !== null);
    assert.equal(readQueueEntry(controlRoot, 2)?.attempt, 2, "the resumed attempt did not survive");
    const head = relaunched.validationQueue.head();
    assert.ok(head !== undefined);
    assert.equal(head.phase, 2, "the rejected phase is not at the head for repair");
    assert.equal(head.attempt, 2, "the head carries the repair's attempt");
    // THE DEPENDENT STAYS HELD (PQ-2): with phase 2 rejected, the admission
    // of phase 3 — declared on it — is a wait, by the queue's own rule.
    const held = admissionOf(
      { phase: 3, dependsOn: [2], writeScope: ["packages/b/"] },
      { approved: new Set([1]), rejected: new Set([2]) },
    );
    assert.equal(held.choice, "wait", "the dependent of the rejected phase is not held");
    assert.equal(held.ruleId, "PQ-2");
  } finally {
    ws.restore();
  }
});
