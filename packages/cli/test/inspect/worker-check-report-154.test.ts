/**
 * THE REPORT PRINTS THE GROUP-CHECK ROWS (feature 154, T086; F154-FR-015):
 * the CLI-level proof that `reportHandler` reads the worker-check records
 * (`specstride.worker-check/1`, T080) from BOTH planes the events were
 * searched in (the call's control plane and the engine root of the workdir),
 * prints `group-check: groupId=<id> result=<failed|tainted>` ONCE per refused
 * group, prints nothing for a `passed` or `unchecked` record, does not
 * duplicate a record visible from both planes, and prints none of it under
 * the `parity` profile (F154-FR-001, F154-SC-012).
 *
 * The verb stays read only: no file is written, and no new event type is
 * introduced — the record is the only surface (F142-FR-066's vocabulary is
 * unchanged).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { controlPlaneOf, type ControlPlane } from "../../src/router/guards.ts";
import type { RoutedCall, RouteIo } from "../../src/router/route.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { reportHandler } from "../../src/inspect/report.ts";

const SLUG = "wc-report-154";
const RUN_ID = "run-154-report";

type Io = { out: string[]; err: string[] };

const ioOf = (): { io: RouteIo; captured: Io } => {
  const captured: Io = { out: [], err: [] };
  return {
    captured,
    io: {
      out: (text: string) => captured.out.push(text),
      err: (text: string) => captured.err.push(text),
    },
  };
};

const callOf = (workdir: string, cp: ControlPlane, io: RouteIo): RoutedCall => ({
  verb: "report",
  extras: ["--feature", SLUG],
  workdir,
  controlPlane: cp,
  io,
  mode: undefined,
});

const writeWorkerCheck = (
  stateDir: string,
  runId: string,
  phase: number,
  groupId: string,
  _result: string,
): string =>
  join(stateDir, "features", SLUG, "runs", runId, "parallel", `phase${phase}`, "groups", groupId);

/** One control root with an engine events file and worker-check records. */
const fixtureOf = (
  root: string,
  runId: string,
  records: readonly { phase: number; groupId: string; result: string }[],
): void => {
  mkdirSync(join(root, "runs", runId), { recursive: true });
  writeFileSync(
    join(root, "runs", runId, "events.jsonl"),
    `${JSON.stringify({
      type: "phase.started",
      at: "2026-11-25T10:00:00.000Z",
      data: { run: runId, phase: 2 },
    })}\n`,
  );
  mkdirSync(join(root, "features", SLUG, "runs", runId), { recursive: true });
  for (const record of records) {
    const dir = writeWorkerCheck(root, runId, record.phase, record.groupId, record.result);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "worker-check.json"),
      `${JSON.stringify({
        schema: "specstride.worker-check/1",
        groupId: record.groupId,
        phase: record.phase,
        result: record.result,
      })}\n`,
    );
  }
};

const groupCheckLines = (out: readonly string[]): readonly string[] =>
  out.filter((line) => line.includes("group-check:"));

test("the report prints group-check once per refused group, not for passed or unchecked", () => {
  const workdir = mkdtempSync(join(tmpdir(), "wc-report-154-"));
  const stateDir = join(workdir, ".specstride");
  try {
    fixtureOf(stateDir, RUN_ID, [
      { phase: 2, groupId: "g-2-1", result: "failed" },
      { phase: 2, groupId: "g-2-2", result: "passed" },
      { phase: 2, groupId: "g-2-3", result: "unchecked" },
      { phase: 3, groupId: "g-3-1", result: "tainted" },
    ]);
    const { io, captured } = ioOf();
    const code = reportHandler(callOf(workdir, controlPlaneOf(workdir), io));
    assert.equal(code, 0);
    const lines = groupCheckLines(captured.out).map((line) => line.trim());
    assert.deepEqual(
      lines,
      ["group-check: groupId=g-2-1 result=failed", "group-check: groupId=g-3-1 result=tainted"],
      `the default output holds exactly one line per refused group, got: ${JSON.stringify(captured.out)}`,
    );
    // Read only: nothing was written by the report.
    assert.equal(captured.err.join(""), "");
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
});

test("a record visible from both planes is printed once, and the engine plane is read too", () => {
  const workdir = mkdtempSync(join(tmpdir(), "wc-report-154-"));
  // The engine root of this workdir is the ONE derivation the engine and the
  // front door share (controlRootOfWorkspace); the test creates it and removes
  // it afterwards.
  const engineRoot = controlRootOfWorkspace(workdir);
  const stateDir = join(workdir, ".specstride");
  try {
    // The events live in the call plane; the record lives in BOTH planes.
    fixtureOf(stateDir, RUN_ID, [{ phase: 2, groupId: "g-2-1", result: "failed" }]);
    fixtureOf(engineRoot, RUN_ID, [{ phase: 2, groupId: "g-2-1", result: "failed" }]);
    const { io, captured } = ioOf();
    const code = reportHandler(callOf(workdir, controlPlaneOf(workdir), io));
    assert.equal(code, 0);
    assert.deepEqual(
      groupCheckLines(captured.out).map((line) => line.trim()),
      ["group-check: groupId=g-2-1 result=failed"],
      "the same record seen from two planes must not print twice",
    );
    // The engine plane alone carries the record: without the call-plane copy
    // the line still prints.
    rmSync(join(stateDir, "features", SLUG, "runs", RUN_ID, "parallel"), {
      recursive: true,
      force: true,
    });
    const second = ioOf();
    assert.equal(reportHandler(callOf(workdir, controlPlaneOf(workdir), second.io)), 0);
    assert.deepEqual(
      groupCheckLines(second.captured.out).map((line) => line.trim()),
      ["group-check: groupId=g-2-1 result=failed"],
      "the engine root is searched when the call plane holds no record",
    );
  } finally {
    rmSync(workdir, { recursive: true, force: true });
    rmSync(engineRoot, { recursive: true, force: true });
  }
});

test("under the parity profile no group-check line is printed", () => {
  const workdir = mkdtempSync(join(tmpdir(), "wc-report-154-"));
  const stateDir = join(workdir, ".specstride");
  const previous = process.env.SPECSTRIDE_PROFILE;
  process.env.SPECSTRIDE_PROFILE = "parity";
  try {
    fixtureOf(stateDir, RUN_ID, [
      { phase: 2, groupId: "g-2-1", result: "failed" },
      { phase: 2, groupId: "g-2-2", result: "tainted" },
    ]);
    const { io, captured } = ioOf();
    const code = reportHandler(callOf(workdir, controlPlaneOf(workdir), io));
    assert.equal(code, 0);
    assert.deepEqual(
      groupCheckLines(captured.out).map((line) => line.trim()),
      [],
      "under parity no line of this feature reaches the output (F154-SC-012)",
    );
  } finally {
    if (previous === undefined) delete process.env.SPECSTRIDE_PROFILE;
    else process.env.SPECSTRIDE_PROFILE = previous;
    rmSync(workdir, { recursive: true, force: true });
  }
});

test("a torn worker-check record contributes nothing", () => {
  const workdir = mkdtempSync(join(tmpdir(), "wc-report-154-"));
  const stateDir = join(workdir, ".specstride");
  try {
    fixtureOf(stateDir, RUN_ID, []);
    const torn = writeWorkerCheck(stateDir, RUN_ID, 2, "g-2-torn", "failed");
    mkdirSync(torn, { recursive: true });
    writeFileSync(join(torn, "worker-check.json"), "{ not json");
    const { io, captured } = ioOf();
    assert.equal(reportHandler(callOf(workdir, controlPlaneOf(workdir), io)), 0);
    assert.deepEqual(groupCheckLines(captured.out), []);
    assert.equal(captured.err.join(""), "");
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
});
