/**
 * T145 to T150, T157 — the tests of the read-only verb `specstride report`
 * (feature 153, F153-FR-039 to -041, F153-SC-002).
 *
 * Every case drives the real router (`route`) over a throwaway control
 * plane, and the process case (T149) drives the real `bin/specstride`
 * executable with an **empty PATH**, so a spawned child could not even
 * start. The verb must print the rows of the events and change no file:
 * no byte is written, no lock is taken, no secret leaves the events.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { route } from "../../src/router/route.ts";
// T147 — validate the JSON document with Ajv at the contracts' pinned version.
// Import Ajv the same way other packages do, to avoid deep node_modules paths.
import { Ajv2020 } from "ajv/dist/2020.js";
import schema from "@specstride/contracts/schemas/report-rows.schema.json" with { type: "json" };

/** The events of T126 (the small stream the core rows were computed on). */
const T126_EVENTS = join(import.meta.dirname, "../../../core/test/fixtures/153/events-small.jsonl");

/** One throwaway workspace: a workdir and its control plane with one run. */
type Workspace = {
  readonly root: string;
  readonly stateDir: string;
  readonly slug: string;
};

/** Make a workspace whose feature `slug` holds one run with `eventsText`. */
function makeWorkspace(slug: string, eventsText: string): Workspace {
  const root = mkdtempSync(join(tmpdir(), "specstride-report-"));
  const stateDir = join(root, ".specstride");
  const run = join(stateDir, "features", slug, "runs", "run-report-1");
  mkdirSync(run, { recursive: true });
  writeFileSync(join(run, "events.jsonl"), eventsText);
  return { root, stateDir, slug };
}

function removeWorkspace(ws: Workspace): void {
  rmSync(ws.root, { recursive: true, force: true });
}

/** Run `report` through the real router over one workspace. */
async function runReport(
  ws: Workspace,
  extra: readonly string[],
): Promise<{ exit: number; out: string; err: string }> {
  let out = "";
  let err = "";
  const exit = await route(["report", ...extra], {
    stateDir: ws.stateDir,
    cwd: ws.root,
    io: { out: (text) => (out += text), err: (text) => (err += text) },
    mode: "default",
  });
  return { exit, out, err };
}

/** A digest listing of every file of a tree: path, size, mtime, content hash. */
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
          `${path}:${stat.size}:${stat.mtimeMs}:${createHash("sha256").update(readFileSync(path)).digest("hex")}`,
        );
    }
  };
  walk(root);
  return lines.sort();
}

test("CT-153-39 it prints the rows of a recorded run", async () => {
  const ws = makeWorkspace("153-loop-feedback-speed", readFileSync(T126_EVENTS, "utf8"));
  try {
    const result = await runReport(ws, ["--feature", ws.slug]);
    assert.equal(result.exit, 0, result.err);
    const lines = result.out.split("\n").filter((line) => line !== "");
    // One line per row, no brace, no blank row line.
    assert.ok(
      lines.every((line) => !line.includes("{")),
      "the terse form holds no brace",
    );
    assert.ok(lines.length >= 20, `one line per row of F153-FR-040 (${lines.length} lines)`);
    assert.match(result.out, /attempts started: 5\n/);
    assert.match(result.out, /attempts closed: 3\n/);
    assert.match(result.out, /attempts unclosed: 2\n/);
    assert.match(result.out, /attempt duration total: 270 s\n/);
    assert.match(result.out, /attempt duration median: 90 s\n/);
    assert.match(result.out, /in-pass checks: 4\n/);
    assert.match(result.out, /checks failed: 2\n/);
    assert.match(result.out, /check duration median: 25 s\n/);
    assert.match(result.out, /critic time total: 42 s\n/);
    assert.match(result.out, /gate time total: 30 s\n/);
    assert.match(result.out, /commit-scan time total: 5 s\n/);
    assert.match(result.out, /phases approved: 1=1\n/);
    assert.match(result.out, /commit-gate blocks by rule: cg-sk-prefix=1\n/);
    assert.match(result.out, /tasks per phase: 1=8, 2=13\n/);
    assert.match(result.out, /verdict MET and UNMET counts: not in the events\n/);
  } finally {
    removeWorkspace(ws);
  }
});

test("CT-153-39 it changes no file", async () => {
  const ws = makeWorkspace("153-loop-feedback-speed", readFileSync(T126_EVENTS, "utf8"));
  try {
    const before = [...treeOf(ws.root)];
    const result = await runReport(ws, ["--feature", ws.slug]);
    assert.equal(result.exit, 0, result.err);
    assert.deepEqual(treeOf(ws.root), before, "no file of the workspace changed");
    assert.equal(existsSync(join(ws.stateDir, "lock")), false, "no lock file was taken");
    assert.equal(existsSync(join(ws.stateDir, ".lock")), false, "no dot-lock was taken");
  } finally {
    removeWorkspace(ws);
  }
});

test("CT-153-41 terse by default, JSON on request", async () => {
  const ws = makeWorkspace("153-loop-feedback-speed", readFileSync(T126_EVENTS, "utf8"));
  try {
    const terse = await runReport(ws, ["--feature", ws.slug]);
    assert.equal(terse.exit, 0, terse.err);
    assert.equal(terse.out.includes("{"), false, "the terse output has no brace");

    const json = await runReport(ws, ["--feature", ws.slug, "--json"]);
    assert.equal(json.exit, 0, json.err);
    const document = JSON.parse(json.out);
    // T147 — validate the JSON document against the schema with Ajv (draft 2020-12).
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(schema as Record<string, unknown>);
    assert.equal(validate(document), true, JSON.stringify(validate.errors));
    // Keep the count equivalence to the terse form below.
    const terseLines = terse.out.split("\n").filter((line) => line !== "");
    assert.equal(terseLines.length, document.rows.length, "at most one line per row");
  } finally {
    removeWorkspace(ws);
  }
});

test("CT-153-41 exit codes", async () => {
  // 0 on a feature with state.
  const ws = makeWorkspace("153-loop-feedback-speed", readFileSync(T126_EVENTS, "utf8"));
  try {
    const ok = await runReport(ws, ["--feature", ws.slug]);
    assert.equal(ok.exit, 0, ok.err);
  } finally {
    removeWorkspace(ws);
  }
  // 1 with one stderr line: a feature with no state, and an unknown feature.
  for (const slug of ["153-loop-feedback-speed", "999-no-such-feature"]) {
    const empty = mkdtempSync(join(tmpdir(), "specstride-report-empty-"));
    try {
      const result = await runReport({ root: empty, stateDir: join(empty, ".specstride"), slug }, [
        "--feature",
        slug,
      ]);
      assert.equal(result.exit, 1, `exit 1 for ${slug}`);
      const errLines = result.err.split("\n").filter((line) => line !== "");
      assert.equal(errLines.length, 1, `one stderr line for ${slug}, got: ${result.err}`);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  }
});

test("CT-153-39 it launches nothing and takes no lock", async () => {
  const ws = makeWorkspace("153-loop-feedback-speed", readFileSync(T126_EVENTS, "utf8"));
  try {
    // A lock file of a run sits in the control plane; the verb must not touch it.
    const lock = join(ws.stateDir, "features", ws.slug, "runs", "run-report-1", "lock.json");
    mkdirSync(dirname(lock), { recursive: true });
    writeFileSync(lock, '{"pid": 1}\n');
    const before = [...treeOf(ws.root)];
    // The real executable, with an EMPTY PATH: any spawned child fails.
    const emptyPath = mkdtempSync(join(tmpdir(), "specstride-empty-path-"));
    const bin = join(import.meta.dirname, "../../bin/specstride");
    const spawned = spawnSync(process.execPath, [bin, "report", "--feature", ws.slug], {
      cwd: ws.root,
      env: { ...process.env, PATH: emptyPath, SPECSTRIDE_STATE_DIR: ws.stateDir },
      encoding: "utf8",
    });
    rmSync(emptyPath, { recursive: true, force: true });
    assert.equal(spawned.status, 0, `exit 0 with an empty PATH (stderr: ${spawned.stderr})`);
    assert.deepEqual(treeOf(ws.root), before, "the lock file is untouched, no file changed");
    assert.equal(readFileSync(lock, "utf8"), '{"pid": 1}\n');
  } finally {
    removeWorkspace(ws);
  }
});

// T160 — recorded run replay: move into this file per task text
const REC_FIXTURE = join(import.meta.dirname, "../fixtures/loop-speed/recorded-152");
const REC_SLUG = "152-commit-backpressure";
const NIE = "not-in-events";

async function reportRecorded(ws: { root: string; stateDir: string }) {
  let out = "";
  let err = "";
  const exit = await route(["report", "--feature", REC_SLUG, "--json"], {
    stateDir: ws.stateDir,
    cwd: ws.root,
    io: { out: (text) => (out += text), err: (text) => (err += text) },
    mode: "default",
  });
  return { exit, out, err };
}

test("F153-SC-008 the report reproduces the measurements (recorded run)", async () => {
  // The frozen copy is the file the README froze: the digest holds.
  const frozen = readFileSync(join(REC_FIXTURE, "events.jsonl"));
  const readme = readFileSync(join(REC_FIXTURE, "README.md"), "utf8");
  const digest = createHash("sha256").update(frozen).digest("hex");
  assert.equal(frozen.length, 4359, "the byte size the README froze");
  assert.ok(readme.includes(digest), `the README carries the SHA-256 ${digest}`);

  const expected = JSON.parse(readFileSync(join(REC_FIXTURE, "expected.json"), "utf8")) as {
    schema: string;
    runId: string | null;
    rows: readonly { row: string; value: unknown; unit?: string }[];
  };
  const ws = makeWorkspace(REC_SLUG, readFileSync(join(REC_FIXTURE, "events.jsonl"), "utf8"));
  try {
    const before = [...treeOf(ws.root)];
    const first = await reportRecorded(ws);
    assert.equal(first.exit, 0, first.err);
    const seen = JSON.parse(first.out) as {
      schema: string;
      runId: string | null;
      rows: readonly { row: string; value: unknown; unit?: string }[];
    };
    const byName = new Map(seen.rows.map((row) => [row.row, row]));
    const expectedNames = new Set<string>();
    for (const row of expected.rows) {
      expectedNames.add(row.row);
      const got = byName.get(row.row);
      assert.notEqual(got, undefined, `the row "${row.row}" is in the report`);
      assert.deepEqual(got, row, `the row "${row.row}" holds the ledger value`);
    }
    for (const row of seen.rows) {
      if (expectedNames.has(row.row)) continue;
      assert.equal(row.value, NIE, `the row "${row.row}" the events cannot hold is marked`);
    }
    // A second run gives byte-identical output and changes no file.
    const second = await reportRecorded(ws);
    assert.equal(second.exit, 0, second.err);
    assert.equal(second.out, first.out, "the two runs are byte-identical");
    assert.deepEqual(treeOf(ws.root), before, "0 files changed");
  } finally {
    removeWorkspace(ws);
  }
});

test("F153-SC-008 the mounted verb runs as a process on the recorded run, with an empty PATH", () => {
  const ws = makeWorkspace(REC_SLUG, readFileSync(join(REC_FIXTURE, "events.jsonl"), "utf8"));
  const emptyPath = mkdtempSync(join(tmpdir(), "specstride-replay-path-"));
  try {
    const before = [...treeOf(ws.root)];
    const bin = join(import.meta.dirname, "../../bin/specstride");
    const spawned = spawnSync(process.execPath, [bin, "report", "--feature", REC_SLUG, "--json"], {
      cwd: ws.root,
      env: { ...process.env, PATH: emptyPath, SPECSTRIDE_STATE_DIR: ws.stateDir },
      encoding: "utf8",
    });
    assert.equal(spawned.status, 0, `exit 0 with an empty PATH (stderr: ${spawned.stderr})`);
    const expected = JSON.parse(readFileSync(join(REC_FIXTURE, "expected.json"), "utf8")) as {
      rows: readonly { row: string; value: unknown; unit?: string }[];
    };
    const seen = JSON.parse(String(spawned.stdout)) as {
      schema: string;
      runId: string | null;
      rows: readonly { row: string; value: unknown; unit?: string }[];
    };
    for (const row of expected.rows) {
      assert.deepEqual(
        seen.rows.find((got) => got.row === row.row),
        row,
        `row "${row.row}" through the process`,
      );
    }
    assert.deepEqual(treeOf(ws.root), before, "no file changed, no lock taken");
  } finally {
    rmSync(emptyPath, { recursive: true, force: true });
    removeWorkspace(ws);
  }
});

test("F153-SC-002 no byte of a secret in the report", async () => {
  const secret = "zzq-secret-9f13d4a1";
  const fragment = secret.slice(0, 8);
  // A planted secret in the test output of a run of the fixture of T043.
  let planted = readFileSync(T126_EVENTS, "utf8");
  const beforePlanted = planted;
  planted = planted.replace('"commandRef":"npm test"', `"commandRef":"npm test ${secret}"`);
  assert.notEqual(planted, beforePlanted, "the planted test output was actually changed");
  // And plant the secret where the handler prints record keys: a commit_gate.blocked rule and an endCause.
  let byHand = readFileSync(T126_EVENTS, "utf8");
  const beforeByHand = byHand;
  byHand = byHand
    .replace('"rules":"cg-sk-prefix"', `"rules":"${secret}"`)
    .replace('"endCause":"approved"', `"endCause":"${secret}"`)
    .replace('"title":"phase one"', `"title":"leak ${secret}"`);
  assert.notEqual(byHand, beforeByHand, "the by-hand injection was actually applied");
  for (const events of [planted, byHand]) {
    const ws = makeWorkspace("153-loop-feedback-speed", events);
    try {
      const terse = await runReport(ws, ["--feature", ws.slug]);
      assert.equal(terse.exit, 0, terse.err);
      assert.equal(terse.out.includes(secret), false, "no secret in the terse output");
      assert.equal(
        terse.out.includes(fragment),
        false,
        "no fragment of the secret in the terse output",
      );
      const json = await runReport(ws, ["--feature", ws.slug, "--json"]);
      assert.equal(json.exit, 0, json.err);
      assert.equal(json.out.includes(secret), false, "no secret in the --json output");
      assert.equal(
        json.out.includes(fragment),
        false,
        "no fragment of the secret in the --json output",
      );
    } finally {
      removeWorkspace(ws);
    }
  }
});
