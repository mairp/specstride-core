/**
 * The log record of a paid task and its reader (`src/evals/log.ts`). The
 * sample hosts here are deliberately NOT the host the module moved out of, and
 * neither of them is the other: one logs two paid tasks, a launch suite and a
 * smoke, the other logs one. The point of the move is that the kit holds the
 * record and the machinery and takes every host fact — the paid task names —
 * as the required `paidTaskNames` input, and that the kit source names no
 * host, no paid task of one and no requirement of one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  INTERRUPTED_EXIT_CODES,
  type PaidRunRecord,
  RunRefusedError,
  USAGE_LIMIT_MARKER,
  appendRunRecord,
  howARunEnded,
  isPaidRunRecord,
  modelIdsFromConfiguration,
  readRunLog,
  skillTextsHashOf,
} from "../src/evals/index.ts";

/** The paid tasks of the first sample host. */
const LAUNCH_HOST_TASKS = ["launch-suite", "launch-smoke"] as const;
/** The paid tasks of the second sample host: one task, not the other host's. */
const ONE_TASK_HOST_TASKS = ["pack-audit"] as const;

/** A well-formed record of the first sample host's own task. */
function aRecord(overrides?: { readonly task?: string }): Record<string, unknown> {
  return {
    date: "2026-11-07",
    task: overrides?.task ?? "launch-suite",
    modelIds: [["a", "model", "of", "its", "configuration"].join("-")],
    calls: 4,
    cost: "0.31",
    skillTextsHash: "b".repeat(64),
    resultPerSkill: [{ skill: "a-skill", scores: [0.9, 0.9], scored: true }],
    runsNotScored: [],
  };
}

test("the record guard takes the host's paid task names as its required input", () => {
  const record = aRecord();
  assert.equal(isPaidRunRecord(record, LAUNCH_HOST_TASKS), true);
  assert.equal(isPaidRunRecord(record, ONE_TASK_HOST_TASKS), false);
  // The second host reads its own record, and neither host reads the other's.
  const audit = aRecord({ task: "pack-audit" });
  assert.equal(isPaidRunRecord(audit, ONE_TASK_HOST_TASKS), true);
  assert.equal(isPaidRunRecord(audit, LAUNCH_HOST_TASKS), false);
  // A record of a task NO host names is a record of neither.
  assert.equal(isPaidRunRecord(aRecord({ task: "a-nightly-job" }), LAUNCH_HOST_TASKS), false);
});

test("the record guard holds the row field for field", () => {
  for (const field of [
    "date",
    "task",
    "modelIds",
    "calls",
    "cost",
    "skillTextsHash",
    "resultPerSkill",
    "runsNotScored",
  ]) {
    const hole = aRecord();
    delete (hole as Record<string, unknown>)[field];
    assert.equal(isPaidRunRecord(hole, LAUNCH_HOST_TASKS), false, `a record has \`${field}\``);
  }
  assert.equal(isPaidRunRecord("a line", LAUNCH_HOST_TASKS), false);
  assert.equal(isPaidRunRecord(null, LAUNCH_HOST_TASKS), false);
});

test("the writer and the reader round-trip one record a line", () => {
  const directory = mkdtempSync(join(tmpdir(), "host-kit-evals-log-"));
  try {
    const path = join(directory, "paid-runs.jsonl");
    const written = appendRunRecord(path, aRecord() as PaidRunRecord);
    assert.match(written, new RegExp(`${"b".repeat(8)}`));
    const log = readRunLog(path, LAUNCH_HOST_TASKS);
    assert.equal(log.length, 1);
    assert.equal(log[0]?.task, "launch-suite");
    assert.equal(Object.isFrozen(log), true, "the reader freezes what it returns");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the reader skips what is not a record of the given host's paid tasks", () => {
  const directory = mkdtempSync(join(tmpdir(), "host-kit-evals-log-"));
  try {
    const path = join(directory, "paid-runs.jsonl");
    writeFileSync(
      path,
      [
        "",
        "   ",
        JSON.stringify({ date: "2026-11-07", task: "a-nightly-job" }),
        JSON.stringify(aRecord()),
        JSON.stringify(aRecord({ task: "pack-audit" })),
        "",
      ].join("\n"),
      "utf8",
    );
    const log = readRunLog(path, LAUNCH_HOST_TASKS);
    assert.equal(log.length, 1, "blank lines and foreign-tasked records are skipped");
    assert.equal(log[0]?.task, "launch-suite");
    assert.equal(readRunLog(join(directory, "absent.jsonl"), LAUNCH_HOST_TASKS).length, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a line that is not JSON at all is refused, as the reader always refused it", () => {
  const directory = mkdtempSync(join(tmpdir(), "host-kit-evals-log-"));
  try {
    const path = join(directory, "paid-runs.jsonl");
    writeFileSync(path, `${JSON.stringify(aRecord())}\n{not json at all\n`, "utf8");
    assert.throws(() => readRunLog(path, LAUNCH_HOST_TASKS), SyntaxError);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("how a run ended: exit 130 and 143 are interruptions, the marker is the usage limit", () => {
  assert.deepEqual([...INTERRUPTED_EXIT_CODES], [130, 143]);
  assert.equal(Object.isFrozen(INTERRUPTED_EXIT_CODES), true);
  assert.equal(USAGE_LIMIT_MARKER, "usage-limit");
  assert.equal(howARunEnded(130), "interrupted");
  assert.equal(howARunEnded(143), "interrupted");
  assert.equal(howARunEnded(null, USAGE_LIMIT_MARKER), "usage-limit");
  assert.equal(howARunEnded(137), "scored", "a kill of the runner's own is not the pinned exit");
  assert.equal(howARunEnded(0), "scored");
  assert.equal(howARunEnded(1), "scored");
});

test("the hash of the skill texts is the sha256 of the texts in their order", () => {
  const hash = skillTextsHashOf(["one", "two"]);
  assert.equal(hash, skillTextsHashOf(["one", "two"]), "stable for the same order");
  assert.notEqual(hash, skillTextsHashOf(["two", "one"]), "order-sensitive");
  assert.match(hash, /^[0-9a-f]{64}$/);
});

test("a configuration that names no model is refused before any call", () => {
  assert.throws(() => modelIdsFromConfiguration({ modelIds: [] }), RunRefusedError);
  assert.throws(() => modelIdsFromConfiguration({}), RunRefusedError);
  assert.throws(
    () => modelIdsFromConfiguration({ judgeModelIds: ["a-judge-model"] }),
    RunRefusedError,
    "a judge model is not the model of the run",
  );
  try {
    modelIdsFromConfiguration({ modelIds: [] });
    assert.fail("the run was not refused");
  } catch (error) {
    assert.match((error as Error).message, /^refused before any call/);
  }
  const configured = ["a-model-of-the-configuration"];
  const modelIds = modelIdsFromConfiguration({ modelIds: configured });
  assert.deepEqual([...modelIds], configured);
  assert.equal(Object.isFrozen(modelIds), true);
});

/* ------------------------------------------------------------- neutrality */

test("the kit source names no host, no paid task of one and no requirement of one", () => {
  const sources = ["index.ts", "log.ts", "release-check.ts"].map(
    (file) =>
      [file, readFileSync(new URL(`../src/evals/${file}`, import.meta.url), "utf8")] as const,
  );
  for (const [file, src] of sources) {
    for (const foreign of [
      "CLAUDE",
      "Claude",
      "claude plugin",
      ".claude-plugin",
      "/specstride:",
      "specstride-",
      "F113-FR",
      "R3v",
      "trigger-suite",
      "behaviour-smoke",
      "with-and-without-report",
      "T035",
      "T037",
    ]) {
      assert.equal(src.includes(foreign), false, `src/evals/${file} must not hold ${foreign}`);
    }
  }
});
