/**
 * T124 — a kill at each step of the landing leaves a state from which the
 * next run reaches the same end (F154-FR-079).
 *
 * For each killpoint of `runLandingForStage` — after the rebase, after the
 * gate, after the fast-forward, before the record — the landing is killed at
 * that point, and the next run (no killpoint) resumes from the landing
 * record on disk and reaches the SAME end as a run that was never killed:
 * the same landed/parked outcome, the same rule id, the same home state, and
 * the same final record. A kill inside the stage-loop glue leaves the
 * workspace `running`, its home untouched: nothing lands during a stop.
 *
 * The ports are fakes over in-memory state, so the same killpoint always
 * sees the same observations (F154-FR-003: the same inputs, the same
 * decision).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  readLandingRecord,
  runLandingForStage,
  type LandingApprovalsPort,
  type LandingChecksPort,
  type LandingGitPort,
  type LandingKillpoint,
  type LandingRunInput,
  type LandingRunOutcome,
} from "../../../packages/pipeline/src/executor/landing-run.ts";
import { runWideGroupLandings } from "../../../packages/pipeline/src/executor/stage-loop.ts";
import type { WorktreePort } from "../../../packages/pipeline/src/executor/stage-workspace.ts";
import type { Stage } from "../../../packages/pipeline/src/executor/types.ts";

/** The end of a landing, as the test compares it. */
type End = {
  landed: boolean;
  parked: boolean;
  ruleId: string;
  fastForward: boolean;
  parkedReason: string | null;
  gateGreen: boolean | null;
  rebaseClean: boolean | null;
  /** The stages home holds, in landing order. */
  home: readonly string[];
};

function endOf(outcome: LandingRunOutcome, home: readonly string[]): End {
  return {
    landed: outcome.landed,
    parked: outcome.parked,
    ruleId: outcome.ruleId,
    fastForward: outcome.record.fastForward,
    parkedReason: outcome.record.parkedReason,
    gateGreen: outcome.record.gateGreen,
    rebaseClean: outcome.record.rebaseClean,
    home,
  };
}

/** Fake ports over in-memory state: home holds landed stages in order. */
function fakeWorld(input: {
  conflict?: readonly string[];
  red?: readonly string[];
}): {
  makeInput(over?: Partial<LandingRunInput>): LandingRunInput;
  home: () => readonly string[];
  git: LandingGitPort & { rebaseCount: number };
} {
  const homeStages: string[] = [];
  const conflicts = new Set(input.conflict ?? []);
  const reds = new Set(input.red ?? []);
  const git: LandingGitPort & { rebaseCount: number } = {
    rebaseCount: 0,
    async rebaseOnto(_home, workspace) {
      this.rebaseCount += 1;
      const stage = basename(workspace);
      return conflicts.has(stage) ? "conflict" : "clean";
    },
    async abortRebase() {},
    async mergeFastForward(workspace) {
      const stage = basename(workspace);
      if (!homeStages.includes(stage)) homeStages.push(stage);
    },
  };
  const checks: LandingChecksPort = {
    async runGate(_workspace, stage) {
      return !reds.has(stage);
    },
  };
  const approvals: LandingApprovalsPort = {
    async noteRewriteAfterFastForward() {
      return { commits: [] };
    },
  };
  return {
    makeInput(over) {
      return {
        controlRoot: over?.controlRoot ?? "",
        home: "/home",
        workspace: over?.workspace ?? "",
        pipelineRunId: "p-154",
        group: ["A"],
        stage: over?.stage ?? "A",
        ports: { git, checks, approvals },
        now: () => new Date("2026-11-25T00:00:00Z"),
        ...(over ?? {}),
      };
    },
    home: () => [...homeStages],
    git,
  };
}

function basename(path: string): string {
  return path.split(/[\\/]/u).at(-1) ?? path;
}

/** One root per case; the record lives under it. */
function root(): string {
  return mkdtempSync(join(tmpdir(), "landing-kills-154-"));
}

const KILLPOINTS: readonly LandingKillpoint[] = [
  "after-rebase",
  "after-gate",
  "after-fast-forward",
  "before-record",
];

test("a kill at each step of a clean landing reaches the same landed end on the next run", async (t) => {
  for (const point of KILLPOINTS) {
    await t.test(`killpoint ${point}`, async () => {
      // The run that is never killed: the reference end.
      const clean = root();
      const killed = root();
      const cleanWorld = fakeWorld({});
      const killedWorld = fakeWorld({});
      try {
        const reference = await runLandingForStage(
          cleanWorld.makeInput({ controlRoot: clean, workspace: "/ws/A" }),
        );
        const referenceEnd = endOf(reference, cleanWorld.home());

        // The killed run: the killpoint throws, the run stops there.
        let thrown: unknown;
        try {
          await runLandingForStage(
            killedWorld.makeInput({
              controlRoot: killed,
              workspace: "/ws/A",
              killpoint: (at) => {
                if (at === point) throw new Error(`kill at ${at}`);
              },
            }),
          );
        } catch (err) {
          thrown = err;
        }
        assert.ok(thrown instanceof Error, `the kill at ${point} must stop the landing`);

        // The next run resumes and reaches the same end.
        const resumed = await runLandingForStage(
          killedWorld.makeInput({ controlRoot: killed, workspace: "/ws/A" }),
        );
        assert.deepEqual(endOf(resumed, killedWorld.home()), referenceEnd);
        assert.equal(resumed.landed, true);
        assert.equal(resumed.ruleId, "LD-1");
        const record = readLandingRecord(killed, "p-154", "A");
        assert.ok(record !== null);
        assert.equal(record.fastForward, true);
      } finally {
        rmSync(clean, { recursive: true, force: true });
        rmSync(killed, { recursive: true, force: true });
      }
    });
  }
});

test("a kill before the parking record leaves a state that parks again, with home unchanged", async (t) => {
  for (const point of ["after-rebase", "before-record"] as const) {
    await t.test(`killpoint ${point} on a conflict`, async () => {
      const clean = root();
      const killed = root();
      const cleanWorld = fakeWorld({ conflict: ["B"] });
      const killedWorld = fakeWorld({ conflict: ["B"] });
      try {
        const reference = await runLandingForStage(
          cleanWorld.makeInput({ controlRoot: clean, workspace: "/ws/B", stage: "B" }),
        );
        assert.equal(reference.parked, true);
        const referenceEnd = endOf(reference, cleanWorld.home());

        let thrown = false;
        try {
          await runLandingForStage(
            killedWorld.makeInput({
              controlRoot: killed,
              workspace: "/ws/B",
              stage: "B",
              killpoint: (at) => {
                if (at === point) throw new Error(`kill at ${at}`);
              },
            }),
          );
        } catch {
          thrown = true;
        }
        assert.equal(thrown, true);
        // The kill landed nothing: home holds nothing (F154-FR-079).
        assert.deepEqual(killedWorld.home(), []);

        const resumed = await runLandingForStage(
          killedWorld.makeInput({ controlRoot: killed, workspace: "/ws/B", stage: "B" }),
        );
        assert.deepEqual(endOf(resumed, killedWorld.home()), referenceEnd);
        assert.equal(resumed.parked, true);
        assert.equal(resumed.exitCode, 22);
      } finally {
        rmSync(clean, { recursive: true, force: true });
        rmSync(killed, { recursive: true, force: true });
      }
    });
  }
});

test("a kill inside the glue leaves the workspace running and nothing landed", async () => {
  const dir = root();
  try {
    const home = join(dir, "home");
    mkdirSync(home, { recursive: true });
    writeFileSync(join(home, ".gitkeep"), "");
    const workspaceOf = (stage: string): string => join(dir, "stage-workspaces", "p-154", stage);
    const worktree: WorktreePort = {
      async add(_home, workspace) {
        mkdirSync(workspace, { recursive: true });
        writeFileSync(join(workspace, "shared.txt"), "stage\n");
      },
      async remove(workspace) {
        rmSync(workspace, { recursive: true, force: true });
      },
    };
    const world = fakeWorld({});
    let thrown = false;
    try {
      await runWideGroupLandings({
        controlRoot: dir,
        home,
        pipelineRunId: "p-154",
        stages: [
          { id: "A", kind: "specstride", dependencies: [], preconditions: [], postconditions: [] },
          { id: "B", kind: "specstride", dependencies: [], preconditions: [], postconditions: [] },
        ] satisfies Stage[],
        ports: { worktree, git: world.git, checks: world.makeInput().ports.checks, approvals: world.makeInput().ports.approvals },
        now: () => new Date("2026-11-25T00:00:00Z"),
        killpoint: (_stage, point) => {
          if (point === "after-rebase") throw new Error("stop");
        },
      });
    } catch {
      thrown = true;
    }
    assert.equal(thrown, true);
    // Nothing landed during the stop (F154-FR-079).
    assert.deepEqual(world.home(), []);
    // The workspace of the killed stage is still `running`, never removed.
    const record = JSON.parse(
      readFileSync(join(dir, "stage-workspaces", "p-154", "A.json"), "utf8"),
    ) as { state: string; removedAt: string | null };
    assert.equal(record.state, "running");
    assert.equal(record.removedAt, null);
    assert.equal(existsSync(workspaceOf("A")), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
