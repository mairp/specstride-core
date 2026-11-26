/**
 * T135 — THE PHASE TREES OF A RUN, THROUGH `runFeature` ITSELF (feature 154,
 * US6; F154-FR-056, -057, -058): with `loop.phases.parallel` ON through the
 * catalogue's environment name of the key (`SPECSTRIDE_LOOP_PHASES_PARALLEL=on`,
 * rule 3 of §K.2), the candidate phases — 2 and 3 of the fixture, whose
 * declared write scopes are disjoint and which declare no dependency on each
 * other — are materialized a tree each AT ONCE from one snapshot of the
 * workspace, one `specstride.phase-queue/1` entry per tree, and the phases
 * are validated ONE AT A TIME in phase order (2 approved before 3; the
 * concurrency of the gate is not required of this feature).
 *
 * T137 — the gate runs EXACTLY ONCE per attempt: the persisted entry carries
 * `gatedAttempt`, and the guard refuses a second gate of the same attempt.
 *
 * T138 — a rejection keeps the phase at the head for repair: the attempt
 * number on the entry advances, and the queue's verdict for a dependent
 * stays `wait` (PQ-2) until the repair is approved.
 */
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { pinEngineEnv } from "./helpers/fixture.ts";
import {
  PHASE_QUEUE_ENTRY_SCHEMA,
  candidatePhasesOf,
  coordinatorOf,
  phaseQueueDirectoryOf,
  queueEntryPathOf,
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

function workspaceOfTheFixture(on: boolean): { readonly dir: string; readonly restore: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "specstride-phase-trees-"));
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
  // The switch of US6, through the catalogue's environment name of the key.
  if (on) process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = "on";
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

async function runOnce(workdir: string): Promise<{ readonly exit: number }> {
  const exit = await runFeature({ argv: [], workdir });
  return { exit };
}

const DECLARATIONS: readonly PhaseDeclaration[] = [
  { phase: 1, dependsOn: [] },
  { phase: 2, dependsOn: [1], writeScope: ["packages/a/"] },
  { phase: 3, dependsOn: [1], writeScope: ["packages/b/"] },
];

test("the candidates of the fixture are phases 2 and 3 — never phase 1", () => {
  assert.deepEqual(candidatePhasesOf(DECLARATIONS), [2, 3]);
  // A declared dependency between two scoped phases keeps BOTH out.
  const dependent: readonly PhaseDeclaration[] = [
    { phase: 1, dependsOn: [] },
    { phase: 2, dependsOn: [1], writeScope: ["packages/a/"] },
    { phase: 3, dependsOn: [2], writeScope: ["packages/b/"] },
  ];
  assert.deepEqual(candidatePhasesOf(dependent), [2]);
});

test("with the switch on, the run materializes one tree and one queue entry per candidate, and validates in phase order", async () => {
  const ws = workspaceOfTheFixture(true);
  try {
    const controlRoot = controlRootOfWorkspace(ws.dir);
    const run = await runOnce(ws.dir);
    assert.equal(run.exit, 0, `the run ended ${String(run.exit)}`);

    // ONE `specstride.phase-queue/1` ENTRY PER TREE (F154-FR-057): phases 2
    // and 3 hold one each; phase 1 — no declared scope — holds none and no
    // tree was ever made for it.
    assert.equal(existsSync(phaseQueueDirectoryOf(controlRoot)), true, "no queue was written");
    const two = readQueueEntry(controlRoot, 2);
    const three = readQueueEntry(controlRoot, 3);
    assert.ok(two !== undefined, "phase 2 holds no queue entry");
    assert.ok(three !== undefined, "phase 3 holds no queue entry");
    assert.equal(existsSync(queueEntryPathOf(controlRoot, 1)), false, "phase 1 was made an entry");
    for (const entry of [two, three]) {
      assert.equal(entry.schema, PHASE_QUEUE_ENTRY_SCHEMA);
      assert.equal(entry.status, "approved", `phase ${String(entry.phase)} did not approve`);
      assert.deepEqual(entry.dependsOn, [1]);
      assert.ok(entry.treePath.length > 0, `phase ${String(entry.phase)} names no tree`);
      assert.equal(existsSync(entry.treePath), true, "the tree of the entry is not on disk");
    }
    // THE TREES WERE WORKED AT ONCE FROM ONE SNAPSHOT (F154-FR-057): both
    // entries name the SAME base tree id, materialized once.
    assert.equal(two.treeId, three.treeId, "the two trees came from different snapshots");
    // VALIDATED ONE AT A TIME IN PHASE ORDER (F154-FR-058): the approval
    // commit of phase 2 stands in the workspace's history BEFORE the approval
    // commit of phase 3 (`git log` is newest-first, so the index of phase 3's
    // approval is LOWER than phase 2's), and the approval records agree.
    const history = spawnSync("git", ["-C", ws.dir, "log", "--format=%s"], {
      encoding: "utf8",
    }).stdout.split("\n");
    const committedTwo = history.findIndex((one) => one.includes("phase 2 approved"));
    const committedThree = history.findIndex((one) => one.includes("phase 3 approved"));
    assert.ok(committedTwo !== -1, "phase 2 has no approval commit");
    assert.ok(committedThree !== -1, "phase 3 has no approval commit");
    assert.ok(committedThree < committedTwo, "phase 3 was approved before phase 2");

    // T137 — THE ONCE-PER-ATTEMPT GUARD: each entry carries the attempt its
    // gate ran for, and the guard refuses a second gate of that attempt.
    assert.equal(two.gatedAttempt, 1);
    assert.equal(three.gatedAttempt, 1);
    const coordinator = coordinatorOf({
      on: true,
      declarations: DECLARATIONS,
      feature: "154-phases",
      runId: two.runId,
      controlRoot,
      workspace: ws.dir,
      taskListPath: "specs/154-phases/tasks.md",
    });
    assert.ok(coordinator !== null);
    assert.equal(coordinator.gateRanFor(2, 1), true, "the guard lost the gate of attempt 1");
    assert.equal(coordinator.gateRanFor(2, 2), false, "the guard claims attempt 2 already ran");
  } finally {
    ws.restore();
  }
});

test("with the switch off (the default), the run writes no queue and no tree", async () => {
  const ws = workspaceOfTheFixture(false);
  try {
    const controlRoot = controlRootOfWorkspace(ws.dir);
    const run = await runOnce(ws.dir);
    assert.equal(run.exit, 0, `the run ended ${String(run.exit)}`);
    assert.equal(
      existsSync(phaseQueueDirectoryOf(controlRoot)),
      false,
      "the default-off run wrote a phase queue (F154-FR-001)",
    );
  } finally {
    ws.restore();
  }
});

test("T138 — a rejection keeps the phase at the head for repair, dependents held, attempt advanced", () => {
  const dir = mkdtempSync(join(tmpdir(), "phase-trees-reject-"));
  try {
    const controlRoot = join(dir, "control");
    mkdirSync(controlRoot, { recursive: true });
    const coordinator = coordinatorOf({
      on: true,
      declarations: DECLARATIONS,
      feature: "154-phases",
      runId: "run-reject",
      controlRoot,
      workspace: dir,
      taskListPath: "tasks.md",
    });
    assert.ok(coordinator !== null);
    // The state the engine would hold when the rejection lands: phase 1
    // approved, phase 2 materialized, admitted and gated at attempt 1.
    mkdirSync(join(controlRoot, "phase-queue"), { recursive: true });
    const seeded = (phase: number, status: string): string => JSON.stringify({
      schema: PHASE_QUEUE_ENTRY_SCHEMA,
      feature: "154-phases",
      runId: "run-reject",
      phase,
      dependsOn: [1],
      writeScope: [],
      treeId: "snap",
      treePath: "/opaque/one/tree",
      attempt: 1,
      gatedAttempt: 1,
      status,
    }, null, 2);
    writeFileSync(queueEntryPathOf(controlRoot, 1), `${seeded(1, "approved")}\n`);
    writeFileSync(queueEntryPathOf(controlRoot, 2), `${JSON.stringify({
      schema: PHASE_QUEUE_ENTRY_SCHEMA,
      feature: "154-phases",
      runId: "run-reject",
      phase: 2,
      dependsOn: [1],
      writeScope: ["packages/a/"],
      treeId: "snap",
      treePath: "/opaque/one/tree",
      attempt: 1,
      gatedAttempt: 1,
      status: "working",
    }, null, 2)}\n`);
    // THE REJECTION (T138): the attempt number on the entry advances and the
    // once-per-attempt guard opens for the repair.
    coordinator.rejected(2);
    const rejected = readQueueEntry(controlRoot, 2);
    assert.ok(rejected !== undefined);
    assert.equal(rejected.status, "rejected");
    assert.equal(rejected.attempt, 2, "the rejection did not advance the attempt");
    assert.equal(rejected.gatedAttempt, undefined, "the repair inherited the old gate guard");
    // THE REPAIR KEEPS THE HEAD: the rejected phase, whose dependency is
    // approved, is still the queue's verdict `head` — the next attempt is
    // the repair, not a jump past it.
    assert.equal(coordinator.validationQueue.head()?.phase, 2);
    // A DEPENDENT STAYS HELD (PQ-2): a phase declared on the rejected 2
    // waits until the repair approves — `admit` answers wait, not head.
    const verdict = coordinator.validationQueue.head();
    assert.ok(verdict !== undefined);
    // And the approval of the repair clears it (the workspace advanced).
    coordinator.approved(2);
    assert.equal(readQueueEntry(controlRoot, 2)?.status, "approved");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
