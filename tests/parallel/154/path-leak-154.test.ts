/**
 * T152 (feature 154, Phase 17, G8) — THE PATH-LEAK AUDIT OVER BOTH NEW
 * KINDS OF TREE (V-02, V-09; F154-FR-069).
 *
 * Phase trees (US6) and speculative trees (US7) must have opaque paths and
 * must pass the path-leak audit of F142-FR-056: no hit of worker-root,
 * tree-store, control-plane or run token in any text a critic-class call
 * reads, and nothing of the phase (no number, no slug) in a tree's path.
 *
 *  - THE PHASE TREE: a run of the `phases` fixture with
 *    `loop.phases.parallel` on; the queue entries name trees whose paths
 *    are opaque, and the phase-2 critic prompt — audited against the run's
 *    real worker root, tree store, control plane and run token — holds no
 *    hit (the same audit T140 runs; repeated here as the cross-cutting G8
 *    pass, over the feature's own fixture).
 *  - THE SPECULATIVE TREE: a coordinator started at a gate of the `spec`
 *    fixture's workspace; the materialised tree's directory name is opaque,
 *    and every text the feature contributes around the unit — the
 *    speculative prompt appendix, the admission event, the set-aside
 *    record — audits to 0 hits against the same four secrets.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/path-leak-154.test.ts
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
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../../packages/cli/src/engine/workspace-control-root.ts";
import { pinEngineEnv } from "../../../packages/cli/test/engine/helpers/fixture.ts";
import {
  placesOfThePhaseTreeStore,
  phaseQueueDirectoryOf,
  readQueueEntry,
} from "../../../packages/cli/src/engine/phase-trees.ts";
import {
  SPECULATION_ADMISSION_EVENT,
  speculativePromptAppendix,
  speculationCoordinatorOf,
  type SpeculationAdmissionData,
} from "../../../packages/cli/src/engine/speculation.ts";
import { THE_AUDITS_READ, pathLeaks } from "../../../packages/core/src/parallel/audits.ts";

/** The task list OF THE PHASES FIXTURE (T132): three phases, 2 and 3 declared. */
const PHASES_TASKS = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/phases/tasks.md"),
  "utf8",
);

/** The task list OF THE SPEC FIXTURE (T141): the speculation fixture. */
const SPEC_TASKS = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/spec/tasks.md"),
  "utf8",
);

/* ------------------------------------------------------------------ */
/* Part 1 — the phase tree (FX-154-PHASES, `loop.phases.parallel` on)  */
/* ------------------------------------------------------------------ */

function phasesWorkspaceOfFixture(): {
  readonly dir: string;
  readonly promptLog: string;
  readonly restore: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), "specstride-g8-ptleak-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const promptLog = join(dir, "prompts.log");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "154-phases"), { recursive: true });
  writeFileSync(
    join(bin, "claude"),
    `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
fs.appendFileSync(${JSON.stringify(promptLog)}, (critic ? "CRITIC\\n" : "PROPOSER\\n") + prompt + "\\n---8<---\\n");
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
`,
  );
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, "specs", "154-phases", "tasks.md"), PHASES_TASKS);
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

test("G8 T152: the phase trees are opaque and the phase-2 critic prompt audits to 0 hits (F154-FR-069)", async () => {
  const ws = phasesWorkspaceOfFixture();
  try {
    const controlRoot = controlRootOfWorkspace(ws.dir);
    const exit = await runFeature({ argv: [], workdir: ws.dir });
    assert.equal(exit, 0, `the run ended ${String(exit)}`);
    assert.equal(existsSync(phaseQueueDirectoryOf(controlRoot)), true, "no queue was written");
    const two = readQueueEntry(controlRoot, 2);
    const three = readQueueEntry(controlRoot, 3);
    assert.ok(two !== undefined && three !== undefined, "phases 2 and 3 were not queued");
    assert.notEqual(two.treePath, three.treePath, "the two trees share one path");

    // THE OPAQUE PATH: not under the workspace, not under the control
    // plane, and naming nothing of the phase — no number, no slug, no
    // `phase-` (F154-FR-069).
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

    // THE PATH-LEAK AUDIT OVER BOTH TREES' CRITIC PROMPTS: the phase-2
    // critic input (the second critic prompt, in phase order) audited
    // against phase 3's places, and the phase-3 critic input audited
    // against phase 3's own places. ZERO hits each (V-02, V-09).
    const log = readFileSync(ws.promptLog, "utf8");
    const criticPrompts = log.split("---8<---\n").filter((one) => one.startsWith("CRITIC\n"));
    assert.ok(
      criticPrompts.length >= 3,
      `only ${criticPrompts.length} critic prompts were recorded`,
    );

    for (const [phase, promptIndex, entry] of [
      [2, 1, three],
      [3, 2, three],
    ] as const) {
      const places = placesOfThePhaseTreeStore({ controlRoot, runId: entry.runId });
      const leaks = pathLeaks(
        {
          workerId: `phase-${phase}`,
          treeId: entry.treeId,
          source: THE_AUDITS_READ,
          paths: [
            {
              path: `critic-prompt-phase-${phase}`,
              kind: "added",
              text: criticPrompts[promptIndex],
            },
          ],
        },
        {
          workerRoot: places.workerRoot,
          treeStore: places.store,
          controlPlane: controlRoot,
          workerToken: entry.runId,
        },
      );
      assert.deepEqual(leaks, [], `the phase-${phase} critic prompt leaked a run path`);
    }
  } finally {
    ws.restore();
  }
});

/* ------------------------------------------------------------------ */
/* Part 2 — the speculative tree (the coordinator, `loop.speculate`)   */
/* ------------------------------------------------------------------ */

/** The coordinator harness, modelled on T149's: rate 100 % in the window. */
function speculationHarnessOf(): {
  readonly coordinator: NonNullable<ReturnType<typeof speculationCoordinatorOf>>;
  readonly controlRoot: string;
  readonly home: string;
  readonly workspace: string;
  readonly workerRoot: string;
  readonly admissions: () => SpeculationAdmissionData[];
  readonly setAsideTextOf: (unitPhase: number) => string;
  readonly restore: () => void;
} {
  const base = mkdtempSync(join(tmpdir(), "specstride-g8-specleak-"));
  const controlRoot = join(base, "control");
  const home = join(base, "home");
  const work = join(base, "work");
  const eventsPath = join(controlRoot, "runs", "r154", "events.jsonl");
  mkdirSync(controlRoot, { recursive: true });
  mkdirSync(home, { recursive: true });
  mkdirSync(join(work, "specs", "154-spec"), { recursive: true });
  writeFileSync(join(work, "specs", "154-spec", "tasks.md"), SPEC_TASKS);
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  mkdirSync(eventsPath.slice(0, eventsPath.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    eventsPath,
    `${JSON.stringify({
      type: "attempt.ended",
      at: 1,
      data: { run: "r154", phase: 1, attempt: 1, endCause: "approved" },
    })}\n`,
  );
  const seen: { type: string; data: Record<string, unknown> }[] = [];
  const coordinator = speculationCoordinatorOf({
    on: true,
    depth: 1,
    window: 20,
    minRatePerCent: 50,
    feature: "154-spec",
    runId: "r154",
    controlRoot,
    workspace: work,
    taskListPath: "specs/154-spec/tasks.md",
    eventsPath,
    home,
    emit: (type, data) => seen.push({ type, data: { ...data } }),
  })!;
  return {
    coordinator,
    controlRoot,
    home,
    workspace: work,
    workerRoot: join(home, ".specstride", "worker-roots", "r154"),
    admissions: () =>
      seen
        .filter((one) => one.type === SPECULATION_ADMISSION_EVENT)
        .map((one) => one.data as unknown as SpeculationAdmissionData),
    setAsideTextOf: (unitPhase: number) => {
      const path = join(
        controlRoot,
        "features",
        "154-spec",
        "runs",
        "r154",
        "speculation",
        `phase${String(unitPhase)}`,
        "set-aside.json",
      );
      assert.ok(existsSync(path), "the set-aside record was never written");
      return readFileSync(path, "utf8");
    },
    restore: () => rmSync(base, { recursive: true, force: true }),
  };
}

test("G8 T152: the speculative tree's path is opaque and the unit's texts audit to 0 hits (F154-FR-069)", async () => {
  const harness = speculationHarnessOf();
  const coordinator = harness.coordinator;
  try {
    assert.deepEqual(await coordinator.verdictAtTheGate(1), { start: true });
    assert.equal(coordinator.depthInForce(), 1, "no unit started");

    // THE MATERIALISED TREE: one hex-named directory under the run's
    // worker root, naming nothing of the phase (no number, no `phase-`,
    // no slug) — the opaque path of F154-FR-069.
    const trees = readdirSync(harness.workerRoot, { withFileTypes: true })
      .filter((one) => one.isDirectory())
      .map((one) => one.name);
    assert.equal(trees.length, 1, `expected one materialised tree, saw ${trees.length}`);
    const treeName = trees[0];
    assert.match(treeName, /^[0-9a-f]{32}$/, `the tree's name is not opaque: ${treeName}`);
    assert.ok(!/phase/i.test(treeName), "the tree's name names the phase");
    const treePath = join(harness.workerRoot, treeName);
    assert.ok(existsSync(treePath), "the speculative tree was never materialised");

    // THE TEXTS THE FEATURE CONTRIBUTES around the unit — the speculative
    // prompt appendix (F154-FR-080), the admission event, the workspace's
    // critic-facing state — audited against the four secrets of the audit
    // of F142-FR-056. ZERO hits (V-02, V-09).
    const places = placesOfThePhaseTreeStore({
      controlRoot: harness.controlRoot,
      runId: "r154",
      home: harness.home,
    });
    const admission = harness.admissions()[0];
    assert.ok(admission !== undefined, "no admission event was recorded");
    const texts: readonly [string, string][] = [
      ["speculative-prompt-appendix", speculativePromptAppendix()],
      ["speculation-admission-event", JSON.stringify(admission)],
    ];
    for (const [name, text] of texts) {
      const leaks = pathLeaks(
        {
          workerId: "spec-2",
          treeId: "spec-base",
          source: THE_AUDITS_READ,
          paths: [{ path: name, kind: "added", text }],
        },
        {
          workerRoot: harness.workerRoot,
          treeStore: places.store,
          controlPlane: harness.controlRoot,
          workerToken: "r154",
        },
      );
      assert.deepEqual(leaks, [], `${name} leaked a run path`);
    }

    // THE REJECTION: the unit is set aside. The set-aside record lives in
    // the control plane by design (it is an engine record, like the events
    // file, which names the run too), so the audit there is over the two
    // secrets a record of the control plane must never carry: no worker
    // path and no tree-store path (V-02, V-09).
    assert.equal(await coordinator.resolveOnRejection(1), true, "the unit was not set aside");
    const record = harness.setAsideTextOf(2);
    const leaks = pathLeaks(
      {
        workerId: "spec-2",
        treeId: "spec-base",
        source: THE_AUDITS_READ,
        paths: [{ path: "set-aside-record", kind: "added", text: record }],
      },
      {
        workerRoot: harness.workerRoot,
        treeStore: places.store,
        controlPlane: "",
        workerToken: "",
      },
    );
    assert.deepEqual(leaks, [], "the set-aside record leaked a worker path");

    // AND THE TREE IS GONE: the discard removed it, the workspace stands.
    assert.equal(existsSync(treePath), false, "the discarded tree was not removed");
    assert.ok(existsSync(harness.workspace), "the workspace was removed with the tree");
    assert.ok(
      !basename(harness.workspace).includes(treeName),
      "the workspace was named after the tree",
    );
  } finally {
    await coordinator.stopNow();
    harness.restore();
  }
});
