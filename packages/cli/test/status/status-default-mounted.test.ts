/**
 * REGRESSION — `specstride status` in default output must never end 70
 * (`reason="internal"`). Before this build the verb was routed for
 * compatibility output only and threw `VerbNotMountedError` in default output,
 * so EVERY host call (`specstride-dsh status --feature …`) failed the same way,
 * run or no run. Pinned over the REAL executable on fixture workspaces:
 *
 *  - a workspace with no state, with state but no launch, and with a pipeline
 *    launch whose engine wrote no run record (the shape a contract launcher
 *    leaves) — every form: text, `--json`, `--line`, `--all`, `--verbose`;
 *  - bare `status` resolves the feature of the newest launch (no
 *    `no feature 'default'`), and `--line` is not taken for a feature;
 *  - the pipeline section reports the pipeline's own state and phase.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const BIN = join(import.meta.dirname, "..", "..", "bin", "specstride");

function run(
  cwd: string,
  args: readonly string[],
): { code: number | null; out: string; err: string } {
  const env = { ...process.env };
  delete env["SPECSTRIDE_STATE_DIR"];
  const r = spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: "utf8",
    env,
    timeout: 30_000,
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "specstride-status-"));
  spawnSync("git", ["init", "-q", dir]);
  return dir;
}

function pipelineWorkspace(): string {
  const dir = workspace();
  const slug = "001-demo";
  const launchId = "launch-t1";
  const control = join(dir, ".specstride");
  mkdirSync(join(control, "launches", launchId), { recursive: true });
  writeFileSync(
    join(control, "launches", launchId, "launch.json"),
    JSON.stringify({
      schema: "specstride.launch/1",
      launchId,
      runId: `run-${launchId}`,
      requestKind: "pipeline",
      request: { pipeline: slug },
      createdAt: "2026-11-09T20:22:51.413Z",
      outcome: "started",
    }),
  );
  writeFileSync(
    join(control, "launches", launchId, "runtime.log"),
    "===== PHASE 1 — Setup  (2026-11-09T20:22:53.459Z) =====\n" +
      "===== PHASE 3 — User Story 1  (2026-11-09T20:53:37.528Z) =====\n",
  );
  const runDir = join(control, "features", slug, "runs", `run-${launchId}`);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(
    join(runDir, "events.jsonl"),
    JSON.stringify({
      schema: "specstride.event",
      v: 1,
      seq: 1,
      ts: "2026-11-09T20:22:52.934Z",
      type: "run.launched",
      runId: `run-${launchId}`,
      launchId,
      data: {},
    }) + "\n",
  );
  const stateDir = join(control, "state", "pipeline", slug, "runs", launchId);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    join(stateDir, "state.json"),
    JSON.stringify({
      pipeline: slug,
      state: "running",
      stages: { "run-x": { status: "running" } },
    }),
  );
  return dir;
}

const FORMS: readonly (readonly string[])[] = [
  [],
  ["--json"],
  ["--line"],
  ["--all"],
  ["--verbose"],
];

test("status never ends 70 / reason=internal, on any workspace shape and form", () => {
  const empty = workspace();
  const pipeline = pipelineWorkspace();
  try {
    for (const dir of [empty, pipeline]) {
      for (const form of FORMS) {
        for (const feature of [[], ["--feature", "001-demo"]]) {
          const r = run(dir, ["status", ...feature, ...form]);
          const where = `${dir} status ${[...feature, ...form].join(" ")}`;
          assert.notEqual(r.code, 70, `${where} ended 70:\n${r.out}${r.err}`);
          assert.doesNotMatch(r.err, /reason="internal"|VerbNotMountedError/, where);
        }
      }
    }
  } finally {
    rmSync(empty, { recursive: true, force: true });
    rmSync(pipeline, { recursive: true, force: true });
  }
});

test("status on a pipeline launch resolves the feature and reports the pipeline", () => {
  const dir = pipelineWorkspace();
  try {
    const bare = run(dir, ["status"]);
    assert.equal(bare.code, 0, bare.out + bare.err);
    assert.match(bare.out, /pipeline: 001-demo .*state running/);
    assert.match(bare.out, /phase: 3 — User Story 1/);
    assert.doesNotMatch(bare.out, /^st=none/m);

    const line = run(dir, ["status", "--line"]);
    assert.equal(line.code, 0, line.out + line.err);
    assert.match(line.out, /^st=running ph=3/);

    const json = run(dir, ["status", "--json"]);
    assert.equal(json.code, 0, json.out + json.err);
    assert.equal(JSON.parse(json.out).schema, "specstride.view/1");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
