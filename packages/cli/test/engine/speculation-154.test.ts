/**
 * T144 (feature 154, US7) — THE GATE-START DECISION AND THE TREE OF THE
 * SPECULATIVE UNIT (F154-FR-061, -062, -066, -067; F154-SC-013).
 *
 * Over the coordinator of `speculation.ts` — the composition root's HALF of
 * US7, with the pure table of `speculation-rule.ts` left untouched — with a
 * REAL tree store (git, one store under a temporary control plane):
 *
 *  - with the approval rate BELOW `loop.speculate.minRate` (F154-SC-013:
 *    29/336 ≈ 9%) no unit starts: the verdict refuses, the ONE admission
 *    event carries the reason `rate` and the metrics, and the worker root
 *    holds no tree (F154-FR-066);
 *  - on SP-1 (rate ≥ minRate, depth < maxDepth, sweep confirmed) the unit
 *    starts: a tree is materialized under the worker root with ONE OPAQUE
 *    name (F154-FR-069), branched from the FROZEN SNAPSHOT of the
 *    workspace — and THE WORKSPACE ITSELF DOES NOT CHANGE, byte for byte
 *    (F154-FR-061);
 *  - the refusals `depth` and `sweep` come from the same table over the
 *    same observation (F154-FR-003): the second gate while a unit is in
 *    flight refuses `depth`; a tree that the critic could read refuses
 *    `sweep` (the amended F142-FR-070, T146);
 *  - SP-5 (F154-FR-063): on approval the unit integrates LIKE A GROUP — the
 *    coordinator produces only the integration inputs, and the composition
 *    and the application run through `integrateGroup` of core, the same
 *    entry point a group uses, exactly as the engine calls it;
 *  - SP-6 (F154-FR-064, -065): on rejection the unit is set aside — the
 *    record `specstride.set-aside/1` lands under the control plane, with
 *    the cost and NO attempt kind and NO stop reason, and the depth falls
 *    back to 0 at no counter.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test packages/cli/test/engine/speculation-154.test.ts
 */
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  SPECULATION_ADMISSION_EVENT,
  SPECULATION_INTEGRATED_EVENT,
  SPECULATION_SET_ASIDE_EVENT,
  ledgerCountsOf,
  promptCarriesNoVerdictWord,
  setAsidePathOf,
  speculativePromptAppendix,
  speculationCoordinatorOf,
  type SpeculationAdmissionData,
  type SpeculationCost,
} from "../../src/engine/speculation.ts";
import { SET_ASIDE_SCHEMA } from "../../../core/src/speculation/set-aside.ts";
import { integrateGroup } from "../../../core/src/parallel/integrate.ts";

/* ------------------------------------------------------------------ *
 * The fixtures: a git workspace, a control plane, an events file.
 * ------------------------------------------------------------------ */

/** A git repository with one committed file, as the workspace of a run. */
function workspaceOf(root: string): void {
  writeFileSync(join(root, "spec.md"), "# the feature\n");
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", root, ...argv]);
  }
}

/** A byte-for-byte fingerprint of a directory tree (F154-FR-061). */
function fingerprintOf(dir: string): string {
  const hash = createHash("sha256");
  const walk = (path: string, rel: string): void => {
    for (const name of readdirSync(path).sort()) {
      const full = join(path, name);
      const next = rel === "" ? name : `${rel}/${name}`;
      if (statSync(full).isDirectory()) walk(full, next);
      else
        hash.update(`${next}:${createHash("sha256").update(readFileSync(full)).digest("hex")}\n`);
    }
  };
  walk(dir, "");
  return hash.digest("hex");
}

/** The entries of the worker root (an absent root reads as no entry). */
function workerRootEntries(workerRoot: string): string[] {
  return existsSync(workerRoot) ? readdirSync(workerRoot) : [];
}

/** One closed attempt of the run's events file (the ledger the rate reads). */
function writeAttempts(eventsPath: string, approved: number, rejected: number): void {
  mkdirSync(eventsPath.slice(0, eventsPath.lastIndexOf("/")), { recursive: true });
  let text = "";
  let ordinal = 0;
  for (let i = 0; i < approved; i += 1) {
    ordinal += 1;
    text += `${JSON.stringify({
      type: "attempt.ended",
      at: 1000 + ordinal,
      data: { run: "r154", phase: 1, attempt: ordinal, endCause: "approved" },
    })}\n`;
  }
  for (let i = 0; i < rejected; i += 1) {
    ordinal += 1;
    text += `${JSON.stringify({
      type: "attempt.ended",
      at: 1000 + ordinal,
      data: { run: "r154", phase: 1, attempt: ordinal, endCause: "rejected" },
    })}\n`;
  }
  writeFileSync(eventsPath, text);
}

/** The coordinator under test, wired to a temporary control plane. */
function coordinatorOf(input?: {
  readonly approved?: number;
  readonly rejected?: number;
  readonly depth?: number;
  readonly minRatePerCent?: number;
  readonly costOf?: () => SpeculationCost;
  readonly criticHasNoTools?: () => boolean;
  readonly readDenialConfirmed?: () => boolean;
}): {
  readonly coordinator: NonNullable<ReturnType<typeof speculationCoordinatorOf>>;
  readonly events: { readonly type: string; readonly data: Record<string, unknown> }[];
  readonly workspace: string;
  readonly controlRoot: string;
  readonly workerRoot: string;
  readonly eventsPath: string;
  readonly restore: () => void;
} {
  const base = mkdtempSync(join(tmpdir(), "specstride-spec-ctl-"));
  const controlRoot = join(base, "control");
  const home = join(base, "home");
  const eventsPath = join(controlRoot, "runs", "r154", "events.jsonl");
  mkdirSync(controlRoot, { recursive: true });
  mkdirSync(home, { recursive: true });
  mkdirSync(join(base, "work"), { recursive: true });
  workspaceOf(join(base, "work"));
  writeAttempts(eventsPath, input?.approved ?? 0, input?.rejected ?? 0);
  const seen: { type: string; data: Record<string, unknown> }[] = [];
  const coordinator = speculationCoordinatorOf({
    on: true,
    depth: input?.depth ?? 1,
    window: 20,
    minRatePerCent: input?.minRatePerCent ?? 50,
    feature: "154-concurrency-and-parallelism",
    runId: "r154",
    controlRoot,
    workspace: join(base, "work"),
    taskListPath: "specs/154/tasks.md",
    eventsPath,
    home,
    emit: (type, data) => seen.push({ type, data: { ...data } }),
    costOf: input?.costOf,
    criticHasNoTools: input?.criticHasNoTools,
    readDenialConfirmed: input?.readDenialConfirmed,
  })!;
  return {
    coordinator,
    events: seen,
    workspace: join(base, "work"),
    controlRoot,
    workerRoot: join(home, ".specstride", "worker-roots", "r154"),
    eventsPath,
    restore: () => rmSync(base, { recursive: true, force: true }),
  };
}

/* ------------------------------------------------------------------ *
 * The tests.
 * ------------------------------------------------------------------ */

test("T144: with the approval rate below minRate no unit starts, for the reason `rate` (F154-SC-013, SP-2)", async () => {
  const harness = coordinatorOf({ approved: 3, rejected: 9 });
  try {
    const verdict = await harness.coordinator.verdictAtTheGate(1);
    assert.deepEqual(verdict, { start: false, reason: "rate" });
    const admissions = harness.events.filter((one) => one.type === SPECULATION_ADMISSION_EVENT);
    assert.equal(admissions.length, 1);
    const data = admissions[0].data as unknown as SpeculationAdmissionData;
    assert.equal(data.decision, "skip");
    assert.equal(data.reason, "rate");
    assert.equal(data.ruleId, "SP-2");
    assert.equal(data.ratePerCent, 25);
    assert.equal(data.window, 20);
    assert.equal(data.minRatePerCent, 50);
    assert.equal(data.depth, 0);
    assert.equal(data.maxDepth, 1);
    assert.equal(data.phase, 1);
    assert.equal(data.unitPhase, 2);
    assert.equal(workerRootEntries(harness.workerRoot).length, 0);
  } finally {
    harness.restore();
  }
});

test("T144: SP-1 starts a unit from the frozen snapshot and the workspace does not change (F154-FR-061, -069)", async () => {
  const harness = coordinatorOf({ approved: 15, rejected: 5 });
  try {
    mkdirSync(harness.workspace, { recursive: true });
    const before = fingerprintOf(harness.workspace);
    const verdict = await harness.coordinator.verdictAtTheGate(1);
    assert.deepEqual(verdict, { start: true });
    const data = harness.events[0].data as unknown as SpeculationAdmissionData;
    assert.equal(data.decision, "start");
    assert.equal(data.ruleId, "SP-1");
    assert.equal(data.ratePerCent, 75);
    assert.equal(harness.coordinator.depthInForce(), 1);
    // THE OPAQUE TREE (F154-FR-069): one directory per tree, a name of no
    // phase (beside the store's own index file).
    assert.equal(existsSync(harness.workerRoot), true);
    const entries = workerRootEntries(harness.workerRoot);
    const opaque = entries.find((one) => /^[0-9a-f]{32}/.test(one));
    assert.notEqual(opaque, undefined);
    assert.equal(existsSync(join(harness.workerRoot, opaque!, "tree")), true);
    // THE FROZEN SNAPSHOT (F154-FR-061): the workspace is untouched.
    assert.equal(fingerprintOf(harness.workspace), before);
  } finally {
    await harness.coordinator.stopNow();
    harness.restore();
  }
});

test("T144: the second gate while a unit is in flight refuses `depth` (SP-3, F154-FR-062)", async () => {
  const harness = coordinatorOf({ approved: 10, rejected: 2 });
  try {
    mkdirSync(harness.workspace, { recursive: true });
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(1), { start: true });
    const verdict = await harness.coordinator.verdictAtTheGate(2);
    assert.deepEqual(verdict, { start: false, reason: "depth" });
    const skips = harness.events.filter((one) => one.type === SPECULATION_ADMISSION_EVENT);
    assert.equal(skips.length, 2);
    assert.equal((skips[1].data as unknown as SpeculationAdmissionData).ruleId, "SP-3");
  } finally {
    await harness.coordinator.stopNow();
    harness.restore();
  }
});

test("T144: a tree the critic could read refuses `sweep` (SP-4; the amended F142-FR-070, T146)", async () => {
  const harness = coordinatorOf({
    approved: 15,
    rejected: 5,
    depth: 2,
    criticHasNoTools: () => false,
    readDenialConfirmed: () => false,
  });
  try {
    mkdirSync(harness.workspace, { recursive: true });
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(1), { start: true });
    const verdict = await harness.coordinator.verdictAtTheGate(2);
    assert.deepEqual(verdict, { start: false, reason: "sweep" });
    const skips = harness.events.filter((one) => one.type === SPECULATION_ADMISSION_EVENT);
    assert.equal((skips[1].data as unknown as SpeculationAdmissionData).ruleId, "SP-4");
  } finally {
    await harness.coordinator.stopNow();
    harness.restore();
  }
});

test("T144: SP-5 — an approval integrates the unit like a group into the workspace (F154-FR-063)", async () => {
  const harness = coordinatorOf({ approved: 15, rejected: 5 });
  try {
    mkdirSync(harness.workspace, { recursive: true });
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(1), { start: true });
    const opaque = workerRootEntries(harness.workerRoot).find((one) => /^[0-9a-f]{32}/.test(one))!;
    const treeRoot = join(harness.workerRoot, opaque, "tree");
    // A SEED PATH IS NEVER PART OF A DELTA (F143-FR-007): the edit the unit
    // works ahead is a NEW path of its own.
    mkdirSync(join(treeRoot, "specs"), { recursive: true });
    writeFileSync(join(treeRoot, "specs", "worked.md"), "worked ahead\n");
    // THE ENGINE'S PATH (T147): the coordinator produces the INTEGRATION
    // INPUTS only; the composition and the application run through
    // `integrateGroup` — the same entry point a group uses — over the
    // coordinator's ports. The edit lands in the workspace from there.
    const inputs = await harness.coordinator.integrationInputsOf(1);
    assert.notEqual(inputs, null);
    assert.equal(inputs!.workerId, "spec-2");
    assert.equal(inputs!.unitPhase, 2);
    assert.deepEqual(inputs!.paths, ["specs/worked.md"]);
    const integration = await integrateGroup(harness.coordinator.integrationPortsOf(), {
      baseTreeId: inputs!.baseTreeId,
      workspace: harness.workspace,
      workers: [
        {
          workerId: inputs!.workerId,
          task: "phase 2",
          finalTreeId: inputs!.finalTreeId,
          paths: inputs!.paths,
          outcome: {
            workerId: inputs!.workerId,
            outcome: "integrated",
            chargesItsTask: false,
            taskReturnsToTheMainLine: false,
          },
        },
      ],
    });
    assert.equal(integration.integrated, true);
    await harness.coordinator.releaseIntegrated();
    assert.equal(
      readFileSync(join(harness.workspace, "specs", "worked.md"), "utf8"),
      "worked ahead\n",
    );
    assert.equal(harness.coordinator.depthInForce(), 0);
    const events = harness.events.filter((one) => one.type === SPECULATION_INTEGRATED_EVENT);
    assert.equal(events.length, 0);
  } finally {
    harness.restore();
  }
});

test("T144: SP-6 — a rejection sets the unit aside, at no counter (F154-FR-064, -065)", async () => {
  const harness = coordinatorOf({
    approved: 15,
    rejected: 5,
    costOf: () => ({ tokens: 1200, wallTimeMs: 3400, cycles: 2 }),
  });
  try {
    mkdirSync(harness.workspace, { recursive: true });
    const before = fingerprintOf(harness.workspace);
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(1), { start: true });
    const opaque = workerRootEntries(harness.workerRoot).find((one) => /^[0-9a-f]{32}/.test(one))!;
    const path = harness.coordinator.setAsidePathOf(2);
    const setAside = await harness.coordinator.resolveOnRejection(1);
    assert.equal(setAside, true);
    const record = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    assert.equal(record["schema"], SET_ASIDE_SCHEMA);
    assert.equal(record["feature"], "154-concurrency-and-parallelism");
    assert.equal(record["runId"], "r154");
    assert.equal(record["phase"], 1);
    assert.equal(record["unitPhase"], 2);
    assert.equal(record["ruleId"], "SP-6");
    assert.deepEqual(record["cost"], { tokens: 1200, wallTimeMs: 3400, cycles: 2 });
    // F154-FR-002 — NO attempt kind and NO stop reason in the record.
    assert.equal("attemptKind" in record, false);
    assert.equal("stopReason" in record, false);
    assert.equal("endCause" in record, false);
    assert.equal("exitCode" in record, false);
    // The tree is gone; the depth fell back to 0; the workspace is untouched.
    assert.equal(existsSync(join(harness.workerRoot, opaque, "tree")), false);
    assert.equal(harness.coordinator.depthInForce(), 0);
    assert.equal(fingerprintOf(harness.workspace), before);
    const events = harness.events.filter((one) => one.type === SPECULATION_SET_ASIDE_EVENT);
    assert.equal(events.length, 1);
    assert.equal(events[0].data["tokens"], 1200);
  } finally {
    harness.restore();
  }
});

test("T144: the ledger reads the last `window` closers of the events file, and a missing file is zero attempts", async () => {
  const harness = coordinatorOf({ approved: 2, rejected: 1 });
  try {
    assert.deepEqual(ledgerCountsOf(harness.eventsPath, 20), { attemptsStarted: 3, approvals: 2 });
    assert.deepEqual(ledgerCountsOf(harness.eventsPath, 2), { attemptsStarted: 2, approvals: 1 });
    assert.deepEqual(ledgerCountsOf(join(harness.controlRoot, "absent.jsonl"), 20), {
      attemptsStarted: 0,
      approvals: 0,
    });
  } finally {
    harness.restore();
  }
});

test("T144: no speculative prompt carries a word of the open verdict (F154-FR-080)", () => {
  assert.equal(promptCarriesNoVerdictWord(speculativePromptAppendix()), true);
  assert.equal(
    promptCarriesNoVerdictWord("The gate rejected phase 1; the verdict is open."),
    false,
  );
  assert.equal(promptCarriesNoVerdictWord("approved by the critic"), false);
});

test("T144: with `loop.speculate` off there is no coordinator and nothing exists (F154-FR-001)", () => {
  const base = mkdtempSync(join(tmpdir(), "specstride-spec-off-"));
  try {
    const coordinator = speculationCoordinatorOf({
      on: false,
      depth: 1,
      window: 20,
      minRatePerCent: 50,
      feature: "154-concurrency-and-parallelism",
      runId: "r154",
      controlRoot: base,
      workspace: base,
      taskListPath: "specs/154/tasks.md",
      eventsPath: join(base, "events.jsonl"),
      emit: () => {},
    });
    assert.equal(coordinator, null);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
