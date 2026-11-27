/**
 * T149 (feature 154, US7) — THE ISOLATION OF THE SPECULATIVE UNIT
 * (F154-FR-067, -068, -074, -080; the amended F142-FR-070, T146).
 *
 *  - NO CRITIC-CLASS CALL SEES A TREE IT COULD READ (F154-FR-067): the
 *    predicate `sweepConfirmsNoReadableTree` of `before-critic.ts` is true
 *    exactly where there is no leftover tree, or the critic has no tools
 *    (IX — the harness's initial record shows it), or the adapter's read
 *    denial of the worker root is confirmed; and the coordinator refuses a
 *    START for the reason `sweep` wherever the predicate is false. Under
 *    the other answer of CQ-154-08 no unit starts at a gate whose critic
 *    could read a tree, so ZERO critic-class calls run while a readable
 *    tree exists outside a confirmed read denial.
 *  - THE PROMPT CARRIES NO WORD OF THE OPEN VERDICT (F154-FR-068, -080):
 *    the only text this feature contributes to a speculative prompt is
 *    checked by `promptCarriesNoVerdictWord` against the word list — the
 *    appendix passes, a prompt that names the verdict does not.
 *  - A STOP ENDS THE SPECULATIVE WORKER LIKE A GROUP WORKER (F154-FR-074):
 *    `stopNow` releases the tree through the store, the workspace is never
 *    touched, and the depth falls back to 0.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test packages/cli/test/engine/speculation-isolation-154.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { sweepConfirmsNoReadableTree } from "../../../core/src/parallel/before-critic.ts";
import {
  SPECULATION_ADMISSION_EVENT,
  promptCarriesNoVerdictWord,
  speculativePromptAppendix,
  speculationCoordinatorOf,
  type SpeculationAdmissionData,
} from "../../src/engine/speculation.ts";

/** A git workspace and the coordinator wired to it, under one temporary root. */
function harnessOf(input?: {
  readonly depth?: number;
  readonly criticHasNoTools?: () => boolean;
  readonly readDenialConfirmed?: () => boolean;
}): {
  readonly coordinator: NonNullable<ReturnType<typeof speculationCoordinatorOf>>;
  readonly workspace: string;
  readonly workerRoot: string;
  readonly admissions: () => SpeculationAdmissionData[];
  readonly restore: () => void;
} {
  const base = mkdtempSync(join(tmpdir(), "specstride-spec-iso-"));
  const controlRoot = join(base, "control");
  const home = join(base, "home");
  const work = join(base, "work");
  const eventsPath = join(controlRoot, "runs", "r154", "events.jsonl");
  mkdirSync(controlRoot, { recursive: true });
  mkdirSync(home, { recursive: true });
  mkdirSync(work, { recursive: true });
  writeFileSync(join(work, "spec.md"), "# the feature\n");
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
    depth: input?.depth ?? 1,
    window: 20,
    minRatePerCent: 50,
    feature: "154-concurrency-and-parallelism",
    runId: "r154",
    controlRoot,
    workspace: work,
    taskListPath: "specs/154/tasks.md",
    eventsPath,
    home,
    emit: (type, data) => seen.push({ type, data: { ...data } }),
    criticHasNoTools: input?.criticHasNoTools,
    readDenialConfirmed: input?.readDenialConfirmed,
  })!;
  return {
    coordinator,
    workspace: work,
    workerRoot: join(home, ".specstride", "worker-roots", "r154"),
    admissions: () =>
      seen
        .filter((one) => one.type === SPECULATION_ADMISSION_EVENT)
        .map((one) => one.data as unknown as SpeculationAdmissionData),
    restore: () => rmSync(base, { recursive: true, force: true }),
  };
}

/* ------------------------------------------------------------------ */

test("T149: a tree stands through a critic-class call only where the critic cannot read it (T146, F154-FR-067)", () => {
  // No leftover tree: the sweep confirms, whatever the critic reads.
  assert.equal(
    sweepConfirmsNoReadableTree({
      criticHasNoTools: false,
      readDenialConfirmed: false,
      leftoverTrees: [],
    }),
    true,
  );
  // A tree AND a critic with no tools (IX): it may stand.
  assert.equal(
    sweepConfirmsNoReadableTree({
      criticHasNoTools: true,
      readDenialConfirmed: false,
      leftoverTrees: ["/worker-roots/r/x/tree"],
    }),
    true,
  );
  // A tree AND a confirmed read denial: it may stand.
  assert.equal(
    sweepConfirmsNoReadableTree({
      criticHasNoTools: false,
      readDenialConfirmed: true,
      leftoverTrees: ["/worker-roots/r/x/tree"],
    }),
    true,
  );
  // A tree the critic COULD read: the sweep does not confirm (T-h).
  assert.equal(
    sweepConfirmsNoReadableTree({
      criticHasNoTools: false,
      readDenialConfirmed: false,
      leftoverTrees: ["/worker-roots/r/x/tree"],
    }),
    false,
  );
});

test("T149: with a readable tree in flight the coordinator refuses a second unit for the reason `sweep`", async () => {
  const harness = harnessOf({
    depth: 2,
    criticHasNoTools: () => false,
    readDenialConfirmed: () => false,
  });
  try {
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(1), { start: true });
    // ZERO new units start while a tree the critic could read exists.
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(2), {
      start: false,
      reason: "sweep",
    });
    const skips = harness.admissions().filter((one) => one.decision === "skip");
    assert.equal(skips.length, 1);
    assert.equal(skips[0].ruleId, "SP-4");
  } finally {
    await harness.coordinator.stopNow();
    harness.restore();
  }
});

test("T149: with the critic unable to read (no tools), a second unit starts (CQ-154-08 A)", async () => {
  const harness = harnessOf({ depth: 2, criticHasNoTools: () => true });
  try {
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(1), { start: true });
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(2), { start: true });
    assert.equal(harness.coordinator.depthInForce(), 2);
  } finally {
    await harness.coordinator.stopNow();
    harness.restore();
  }
});

test("T149: the speculative prompt carries no word of the open verdict (F154-FR-080)", () => {
  const appendix = speculativePromptAppendix();
  assert.equal(promptCarriesNoVerdictWord(appendix), true);
  // And every word the feature must never name is on the list it checks.
  for (const word of ["verdict", "approved", "rejected", "gate", "critic", "malformed"]) {
    assert.equal(promptCarriesNoVerdictWord(`the ${word} of phase 1`), false, word);
  }
});

test("T149: a stop ends the speculative worker like a group worker (F154-FR-074)", async () => {
  const harness = harnessOf({});
  try {
    mkdirSync(harness.workspace, { recursive: true });
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(1), { start: true });
    const entries = readdirSync(harness.workerRoot);
    const opaque = entries.find((one) => /^[0-9a-f]{32}$/.test(one))!;
    assert.equal(existsSync(join(harness.workerRoot, opaque, "tree")), true);
    await harness.coordinator.stopNow();
    // The tree is released and removed; the depth falls back to 0.
    assert.equal(existsSync(join(harness.workerRoot, opaque, "tree")), false);
    assert.equal(harness.coordinator.depthInForce(), 0);
    // A second stop is a no-op, and the workspace was never touched.
    await harness.coordinator.stopNow();
    assert.equal(existsSync(join(harness.workspace, "spec.md")), true);
    const closers = harness.admissions();
    assert.equal(closers.length, 1);
  } finally {
    harness.restore();
  }
});
