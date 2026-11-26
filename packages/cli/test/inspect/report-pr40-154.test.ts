/**
 * T036, T037 — the tests of the report over the engine records of a whole
 * finished feature (feature 154, F154-FR-013, F154-FR-016; PR #40).
 *
 * The engine writes one `events.jsonl` per run or relaunch under
 * `<control>/runs/<runId>/`; the reader (`select.ts` `engineEventFilesOf`)
 * reads every run file of the feature in time order and the report prints
 * one run. The fixture `recorded-153/` is the frozen copy of feature 153's
 * whole record: on it the report prints the counts of F154-SC-009 — 336
 * attempts started, 29 approvals over 29 phases, 274 of 386 in-pass checks
 * failed — counting a `phase.ended` of the old vocabulary as an approval
 * (F154-FR-013). The verb stays read only: no file changes, the second run
 * is byte-identical.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cpSync,
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
import { route } from "../../src/router/route.ts";

/** The frozen record of feature 153 (T035): one `events.jsonl` per run. */
const REC153 = join(import.meta.dirname, "../fixtures/loop-speed/recorded-153");
const REC153_RUNS = join(REC153, "runs");
const REC153_SLUG = "153-loop-feedback-speed";

type Expected = {
  readonly schema: string;
  readonly runId: string | null;
  readonly rows: readonly { row: string; value: unknown; unit?: string }[];
  readonly groupsByOutcome: Readonly<Record<string, number>>;
};

type Seen = {
  readonly schema: string;
  readonly runId: string | null;
  readonly rows: readonly { row: string; value: unknown; unit?: string }[];
};

/** One throwaway control plane: `runs/<id>/events.jsonl` per frozen run. */
function makeWorkspace(slug: string, runIds: readonly string[]): string {
  const root = mkdtempSync(join(tmpdir(), "specstride-report-154-"));
  const stateDir = join(root, "control");
  // The sole feature of the control root: the reader then attributes every
  // run file of `runs/` to it (the events carry no feature name).
  mkdirSync(join(stateDir, "features", slug), { recursive: true });
  for (const id of runIds) {
    mkdirSync(join(stateDir, "runs", id), { recursive: true });
    cpSync(join(REC153_RUNS, id, "events.jsonl"), join(stateDir, "runs", id, "events.jsonl"));
  }
  return root;
}

/** A digest listing of every file of a tree: path, size, content hash. */
function treeOf(root: string): readonly string[] {
  if (!existsSync(root)) return [];
  const lines: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const stat = statSync(path);
      if (stat.isDirectory()) walk(path);
      else
        lines.push(
          `${path}:${stat.size}:${createHash("sha256").update(readFileSync(path)).digest("hex")}`,
        );
    }
  };
  walk(root);
  return lines.sort();
}

/** Run `report --feature <slug> --json` through the real router. */
async function reportOf(
  root: string,
  slug: string,
): Promise<{ exit: number; out: string; err: string }> {
  let out = "";
  let err = "";
  const exit = await route(["report", "--feature", slug, "--json"], {
    stateDir: join(root, "control"),
    cwd: root,
    io: { out: (text) => (out += text), err: (text) => (err += text) },
    mode: "default",
  });
  return { exit, out, err };
}

function rowOf(seen: Seen, name: string): { row: string; value: unknown; unit?: string } {
  const row = seen.rows.find((candidate) => candidate.row === name);
  assert.notEqual(row, undefined, `the row "${name}" is in the report`);
  return row as { row: string; value: unknown; unit?: string };
}

test("F154-FR-016 it reads every run file of the feature, in time order: two relaunches print one run", async () => {
  const root = mkdtempSync(join(tmpdir(), "specstride-report-154-relaunch-"));
  const stateDir = join(root, "control");
  const slug = "154-concurrency-and-parallelism";
  const line = (type: string, at: string, data: Record<string, unknown>): string =>
    `${JSON.stringify({ type, at, data })}\n`;
  try {
    mkdirSync(join(stateDir, "features", slug), { recursive: true });
    // Relaunch A: phase 1 attempt 1 crashes. Relaunch B, hours later, opens
    // attempt 1 again and approves it: read in time order, the pairing and
    // the approval count follow the timestamps, never the file order.
    mkdirSync(join(stateDir, "runs", "run-relaunch-b"), { recursive: true });
    writeFileSync(
      join(stateDir, "runs", "run-relaunch-b", "events.jsonl"),
      line("attempt.ended", "2026-11-24T12:00:00.000Z", {
        phase: 1,
        attempt: 1,
        endCause: "approved",
      }) + line("phase.ended", "2026-11-24T12:00:01.000Z", { phase: 1, attempt: 1, title: "t" }),
    );
    mkdirSync(join(stateDir, "runs", "run-relaunch-a"), { recursive: true });
    writeFileSync(
      join(stateDir, "runs", "run-relaunch-a", "events.jsonl"),
      line("attempt.started", "2026-11-24T09:00:00.000Z", { phase: 1, attempt: 1 }) +
        line("attempt.ended", "2026-11-24T09:10:00.000Z", {
          phase: 1,
          attempt: 1,
          endCause: "crash",
        }),
    );
    const before = [...treeOf(root)];
    const result = await reportOf(root, slug);
    assert.equal(result.exit, 0, result.err);
    const seen = JSON.parse(result.out) as Seen;
    // Time order: the crash of A first, the approval of B second.
    assert.deepEqual(rowOf(seen, "attempts started").value, 2);
    assert.deepEqual(rowOf(seen, "attempts closed").value, 2);
    assert.deepEqual(rowOf(seen, "approvals").value, 1);
    assert.deepEqual(rowOf(seen, "phases approved count").value, 1);
    assert.deepEqual(rowOf(seen, "approvals per attempt started").value, {
      approvals: 1,
      started: 2,
    });
    // The old vocabulary counts: `phase.ended` of relaunch B is the approval.
    assert.deepEqual(rowOf(seen, "phases approved").value, { "1": 1 });
    assert.deepEqual(treeOf(root), before, "the report writes no file");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("F154-SC-009 on the frozen record of feature 153 the report prints the counts of the ledger", async () => {
  const expected = JSON.parse(readFileSync(join(REC153, "expected.json"), "utf8")) as Expected;
  const runIds = readdirSync(REC153_RUNS).sort();
  assert.equal(runIds.length, 32, "the freeze holds 32 run files (R-C17: many relaunches)");
  const root = makeWorkspace(REC153_SLUG, runIds);
  try {
    const before = [...treeOf(root)];
    const first = await reportOf(root, REC153_SLUG);
    assert.equal(first.exit, 0, first.err);
    const seen = JSON.parse(first.out) as Seen;
    // The counts of F154-SC-009 — the ledger's numbers, printed by the product.
    assert.deepEqual(rowOf(seen, "attempts started").value, 336);
    assert.deepEqual(rowOf(seen, "approvals").value, 29);
    assert.deepEqual(rowOf(seen, "phases approved count").value, 29);
    assert.deepEqual(rowOf(seen, "approvals per attempt started").value, {
      approvals: 29,
      started: 336,
    });
    assert.deepEqual(rowOf(seen, "in-pass checks").value, 386);
    assert.deepEqual(rowOf(seen, "checks failed").value, 274);
    // And every row of the freeze holds the recorded value.
    for (const row of expected.rows) {
      assert.deepEqual(rowOf(seen, row.row), row, `the row "${row.row}" holds the frozen value`);
    }
    // A second run is byte-identical and no file changed.
    const second = await reportOf(root, REC153_SLUG);
    assert.equal(second.exit, 0, second.err);
    assert.equal(second.out, first.out, "the two runs are byte-identical");
    assert.deepEqual(treeOf(root), before, "0 files changed");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("F154-SC-009 the freeze is intact: every run file holds its README digest", () => {
  const readme = readFileSync(join(REC153, "README.md"), "utf8");
  for (const id of readdirSync(REC153_RUNS).sort()) {
    const buf = readFileSync(join(REC153_RUNS, id, "events.jsonl"));
    const digest = createHash("sha256").update(buf).digest("hex");
    assert.ok(
      readme.includes(`${id} ${buf.length} ${digest}`),
      `the README carries the digest of ${id}`,
    );
  }
  // The 28 groups of the ledger (R-M9): every `parallel.group.ended` says repair.
  let ended = 0;
  const outcomes = new Map<string, number>();
  for (const id of readdirSync(REC153_RUNS).sort()) {
    for (const line of readFileSync(join(REC153_RUNS, id, "events.jsonl"), "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const record = JSON.parse(line) as { type: string; data?: Record<string, unknown> };
      if (record.type !== "parallel.group.ended") continue;
      ended += 1;
      const outcome = String(record.data?.["outcome"] ?? "");
      outcomes.set(outcome, (outcomes.get(outcome) ?? 0) + 1);
    }
  }
  assert.equal(ended, 28, "28 groups ended over the freeze");
  assert.deepEqual([...outcomes.entries()], [["repair", 28]], "every group ended repair");
});
