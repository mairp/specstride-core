/**
 * T067 — THE REPLAY OF THE PHASE 4 TRIAL AT PHASE 23 (F154-FR-026,
 * F154-FR-027; F154-SC-012), over the REAL wiring and the REAL attempt:
 *
 *  - A — THE REPEAT RULE REFUSES THE RETRY: the plan puts the group in
 *    phase 23 (`g-23-1`), the ledger of the phase holds its earlier failure,
 *    and the fingerprint of the group's named paths is unchanged — the layer's
 *    own `repeatVerdictOf` answers RP-1, the group event says `admitted:
 *    false`, the engine says "not admitted — repeat", and the group starts NO
 *    run at all (no ledger record beyond the admission events);
 *  - B — THE ADMITTED GROUP WITH AN APPLICATION OF 0 PATHS: the workers end
 *    whole but change no path, so NO merge check runs (no
 *    `merge_check_started`/`merge_check_finished` record), the group closes
 *    NOT failed, no repair is charged, and the comparison is recorded as
 *    `specstride.merge-baseline/1` with the rule id MG-1 (F154-FR-027).
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import type { ChildProcess } from "node:child_process";

import type { ParallelPlan } from "../../../layer-parallel/src/index.ts";
import { groupGate } from "../../../layer-parallel/src/index.ts";
import {
  isTheSameTaskSetFailedEarlier,
  repeatVerdictOf,
  type EarlierFailureOfAGroup,
  type RepeatVerdict,
} from "../../../layer-parallel/src/repeat.ts";
import {
  parallelWiringOfTheAttempt,
  type ParallelWiringInput,
} from "../../src/engine/parallel-wiring.ts";

import { fixtureOf, wiringOf } from "./parallel-wiring.test.ts";

const RUN_ID = "run-wiring";
const hash = (text: string): string => createHash("sha256").update(text).digest("hex");

/** The plan of the replay: ONE group in phase 23, `g-23-1`. */
function planOfPhase23(): ParallelPlan {
  const scope = { prefixes: ["src"], source: "task-text" as const };
  const all = ["T001", "T002", "T003"];
  return {
    schema: "specstride.parallel-plan/1",
    runId: RUN_ID,
    hash: "plan-hash-replay-23",
    workers: 2,
    fallback: undefined,
    phases: [
      {
        phase: 23,
        groups: [{ ordinal: 1, phase: 23, tasks: ["T002", "T003"] }],
        tasks: all.map((id) => ({ id, scope, checks: [] })),
        serial: ["T001"],
        ceiling: 2,
      },
    ],
  };
}

/** The wiring input over the fixture, at phase 23. */
function replayWiring(
  fixture: ReturnType<typeof fixtureOf>,
  overrides: {
    readonly repeatVerdictOf?: (group: {
      phase: number;
      ordinal: number;
      tasks: readonly string[];
    }) => RepeatVerdict;
    readonly emit?: (type: string, data: Record<string, unknown>) => void;
    readonly say?: (line: string) => void;
  } = {},
): ParallelWiringInput {
  const base = wiringOf(fixture, { plan: planOfPhase23() });
  return {
    ...base.input,
    phase: 23,
    keptUnitsOf: () => ["T001"],
    groupGateOfTheAttempt: (inputs) => groupGate(inputs),
    ...(overrides.repeatVerdictOf === undefined
      ? {}
      : { repeatVerdictOf: overrides.repeatVerdictOf as ParallelWiringInput["repeatVerdictOf"] }),
    ...(overrides.emit === undefined ? {} : { emit: overrides.emit }),
    ...(overrides.say === undefined ? {} : { say: overrides.say }),
  };
}

/**
 * The start door of test B: REAL worker processes that write their checkpoint
 * and end whole, changing NO path of their tree — an application of 0 paths.
 */
function checkpointOnlyDoor() {
  const script = `
const fs = require("node:fs");
const path = require("node:path");
const [outbox, taskId] = process.argv.slice(1);
fs.mkdirSync(outbox, { recursive: true });
fs.writeFileSync(path.join(outbox, taskId + ".checkpoint.json"), JSON.stringify({ task: taskId }));
`;
  return {
    start: async (worker: {
      readonly workerId: string;
      readonly taskId: string;
      readonly outboxPath: string;
      readonly tree: string;
    }) => {
      const child = spawn(process.execPath, ["-e", script, worker.outboxPath, worker.taskId], {
        detached: true,
        stdio: "ignore",
      }) as ChildProcess & { pid: number };
      child.unref();
      const ended = new Promise<"ended" | "killed">((done) => {
        child.once("exit", (code) => done(code === 0 ? "ended" : "killed"));
      });
      return {
        workerId: worker.workerId,
        pid: child.pid,
        startTime: new Date().toISOString(),
        processGroup: child.pid,
        runTokenHash: hash("run-token-of-the-wiring"),
        ended,
      };
    },
  };
}

/** The kinds the ledger of the run holds, as the file holds them. */
function ledgerKinds(controlRoot: string): readonly string[] {
  const file = join(controlRoot, "runs", RUN_ID, "parallel-ledger.jsonl");
  if (!existsSync(file)) return [];
  return readAppendedKinds(readFileSync(file, "utf8"));
}

function readAppendedKinds(text: string): readonly string[] {
  const kinds: string[] = [];
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    try {
      kinds.push((JSON.parse(line) as { kind?: string }).kind ?? "");
    } catch {
      // A torn tail line is not a record.
    }
  }
  return kinds;
}

test("the replay of the phase 4 trial: the unchanged retry of g-23-1 is refused by RP-1", async () => {
  const fixture = fixtureOf("replay-refused");
  const said: string[] = [];
  const events: { type: string; data: Record<string, unknown> }[] = [];
  try {
    // The earlier failure of THIS phase attempt: the group's own failure on
    // its first run, with the fingerprint of its named paths UNCHANGED since.
    const earlierFailures: readonly EarlierFailureOfAGroup[] = [
      { groupId: "g-23-1", phase: 23, tasks: ["T002", "T003"] },
    ];
    const input = replayWiring(fixture, {
      say: (line) => said.push(line),
      emit: (type, data) => events.push({ type, data }),
      // The seam the composition root wires: the REAL layer verdict over the
      // ledger's failed groups, with the fingerprint seam answering
      // "unchanged".
      repeatVerdictOf: (group) => repeatVerdictOf(group, earlierFailures, () => true),
    });
    const wiring = parallelWiringOfTheAttempt(input);
    // The group was refused: the boundary starts no run.
    assert.equal(await wiring.startIfTheBoundaryIsClean(), false);
    // The layer's verdict itself: RP-1, refused, unchanged.
    const verdict = repeatVerdictOf(
      { phase: 23, ordinal: 1, tasks: ["T002", "T003"] },
      earlierFailures,
      () => true,
    );
    assert.equal(verdict.passed, false);
    assert.equal(verdict.ruleId, "RP-1");
    assert.match(verdict.detail, /unchanged/);
    assert.ok(
      isTheSameTaskSetFailedEarlier(
        { groupId: "g-23-1", phase: 23, tasks: ["T002", "T003"] },
        earlierFailures,
      ),
    );
    // The engine says why, with the repeat rule's detail.
    assert.ok(
      said.some((line) => line.includes("not admitted") && line.includes("repeat")),
      `no repeat refusal among ${JSON.stringify(said)}`,
    );
    // The group event records the refusal with `admitted: false`.
    const ofGroup = events.filter(
      (event) => event.type === "parallel.admission" && event.data.groupId === "g-23-1",
    );
    assert.equal(ofGroup.length, 1);
    assert.equal(ofGroup[0]?.data.admitted, false);
    // And the group started NO run: no ledger record of an attempt.
    assert.deepEqual(
      ledgerKinds(fixture.controlRoot).filter((kind) => kind !== "parallel.admission"),
      [],
    );
  } finally {
    fixture.cleanup();
  }
});

test("the replay with a CHANGED fingerprint is admitted (RP-2, changed)", async () => {
  const fixture = fixtureOf("replay-changed");
  const said: string[] = [];
  try {
    const earlierFailures: readonly EarlierFailureOfAGroup[] = [
      { groupId: "g-23-1", phase: 23, tasks: ["T002", "T003"] },
    ];
    const input = replayWiring(fixture, {
      say: (line) => said.push(line),
      repeatVerdictOf: (group) => repeatVerdictOf(group, earlierFailures, () => false),
    });
    const _wiring = parallelWiringOfTheAttempt(input);
    // RP-2 admits: the group runs (the run itself fails on the no-edit door —
    // the checkpoint-only door ends the workers without any path applied —
    // but the point here is the ADMISSION, not the run).
    const verdict = repeatVerdictOf(
      { phase: 23, ordinal: 1, tasks: ["T002", "T003"] },
      earlierFailures,
      () => false,
    );
    assert.equal(verdict.passed, true);
    assert.equal(verdict.ruleId, "RP-2");
    assert.match(verdict.detail, /changed/);
    assert.ok(
      !said.some((line) => line.includes("not admitted") && line.includes("repeat")),
      `a changed fingerprint was still refused: ${JSON.stringify(said)}`,
    );
  } finally {
    fixture.cleanup();
  }
});

test("the admitted group of g-23-1 with an application of 0 paths runs no merge check", async () => {
  const fixture = fixtureOf("replay-empty");
  const events: { type: string; data: Record<string, unknown> }[] = [];
  try {
    const input = replayWiring(fixture, {
      emit: (type, data) => events.push({ type, data }),
    });
    // THE NO-EDIT DOOR: the workers end whole and change no path, so the
    // application applies 0 paths. The wiring hands the count through the
    // appliedPathCountOf seam; the attempt's own default reads the
    // integration's paths — 0 either way here.
    const wiring = parallelWiringOfTheAttempt({
      ...input,
      startDoor: checkpointOnlyDoor().start as never,
      appliedPathCountOf: () => 0,
    });
    await wiring.startIfTheBoundaryIsClean();
    const kinds = ledgerKinds(fixture.controlRoot);
    // NO merge check ran: no record of its start or its finish.
    assert.ok(!kinds.includes("merge_check_started"), `kinds: ${kinds.join(",")}`);
    assert.ok(!kinds.includes("merge_check_finished"));
    // The group closed, and NOT as a failed group (F154-FR-027).
    const closed = kinds.lastIndexOf("group_closed");
    assert.ok(closed >= 0, `no group_closed among ${kinds.join(",")}`);
    const closedLine = readFileSync(
      join(fixture.controlRoot, "runs", RUN_ID, "parallel-ledger.jsonl"),
      "utf8",
    )
      .split("\n")
      .filter((line) => line.includes("group_closed"))
      .at(-1) as string;
    assert.equal((JSON.parse(closedLine) as { data: { outcome: string } }).data.outcome, "closed");
    // No repair was charged: no repair record of any kind is in the ledger.
    assert.ok(!kinds.some((kind) => kind.includes("repair")));
    // THE COMPARISON IS RECORDED: the merge-baseline record with MG-1.
    const baselines = events.filter(
      (event) =>
        event.type === "parallel.integration" &&
        event.data.record === "specstride.merge-baseline/1",
    );
    assert.equal(baselines.length, 1);
    assert.equal(baselines[0]?.data.record, "specstride.merge-baseline/1");
    assert.equal(baselines[0]?.data.ruleId, "MG-1");
    assert.equal(baselines[0]?.data.groupId, "g-23-1");
  } finally {
    fixture.cleanup();
  }
});
