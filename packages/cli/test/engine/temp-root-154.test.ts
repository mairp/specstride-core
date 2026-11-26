/**
 * T025 — THE TEMPORARY ROOT OF THE RUN, THROUGH `runFeature` ITSELF
 * (F154-FR-043, F154-FR-079): the test drives the composition root
 * (`runFeature`, as `run-feature.test.ts` does — the stub `claude` on the
 * fixture's `PATH`) over the task list of the feature's fixture
 * (`tests/fixtures/154/groups/`), with `host.limits` ON through the
 * catalogue's environment name of the key (rule 3 of §K.2:
 * `SPECSTRIDE_HOST_LIMITS=on` — the run reads the environment at rank 4).
 *
 * It proves, through the run's own behaviour:
 * - two runs hold two DIFFERENT roots (each run makes its own, the
 *   `[slug] temporary root of the run:` line names it);
 * - after a NORMAL end the root is gone;
 * - after a STOP (the unbound inbox request the `stop` surface writes, the
 *   same mechanism the stop-related tests use) the run ends `stop_flag` and
 *   its root is gone too — the removal at the run's single exit path.
 */
import assert from "node:assert/strict";
import { existsSync, chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { pinEngineEnv } from "./helpers/fixture.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The task list OF THE FIXTURE (T022): three tasks, one phase. */
const FIXTURE_TASKS = readFileSync(join(HERE, "../../../../tests/fixtures/154/groups/tasks.md"), "utf8");

/** The stub `claude` of the run-feature tests: an honest phase is approved. */
const STUB = `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  const tasks = "specs/154-groups/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace(/- \\[ \\] (T00[123])/g, "- [x] $1"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;

/**
 * One workspace over the fixture's task list: the run-feature harness (git
 * init, the stub `claude` on `PATH`, `HOME` pinned), with the runs of the
 * test enabled for `host.limits` through the environment name of the key.
 */
function workspaceOfTheFixture(): { readonly dir: string; readonly restore: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "specstride-run-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "154-groups"), { recursive: true });
  writeFileSync(join(bin, "claude"), STUB);
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, "specs", "154-groups", "tasks.md"), FIXTURE_TASKS);
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
    HOST_LIMITS: process.env.SPECSTRIDE_HOST_LIMITS,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  // F154-FR-043, T024: the switch the run's `runTempRoot` block reads —
  // `on` through the catalogue's environment name of `host.limits`.
  process.env.SPECSTRIDE_HOST_LIMITS = "on";
  const restoreEnv = pinEngineEnv({ feature: "154-groups" });
  return {
    dir: work,
    restore: () => {
      restoreEnv();
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.HOST_LIMITS === undefined) delete process.env.SPECSTRIDE_HOST_LIMITS;
      else process.env.SPECSTRIDE_HOST_LIMITS = before.HOST_LIMITS;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/**
 * One run over the workspace, with the run's own stdout captured so the
 * `[slug] temporary root of the run:` line names the root the run made.
 */
async function runWithCapturedRoot(
  workdir: string,
): Promise<{ readonly exit: number; readonly tempRoot: string | null; readonly said: string }> {
  const said: string[] = [];
  const realWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    said.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  try {
    const exit = await runFeature({ argv: [], workdir });
    const match = /temporary root of the run: (\S+)/.exec(said.join(""));
    return { exit, tempRoot: match === null ? null : match[1], said: said.join("") };
  } finally {
    process.stdout.write = realWrite;
  }
}

test("two runs over the fixture hold two different temporary roots, both removed after their normal end", async () => {
  const one = workspaceOfTheFixture();
  const two = workspaceOfTheFixture();
  try {
    const first = await runWithCapturedRoot(one.dir);
    const second = await runWithCapturedRoot(two.dir);
    // The runs succeeded — the stub approved the fixture's one phase.
    assert.equal(first.exit, 0, `the first run ended ${String(first.exit)}`);
    assert.equal(second.exit, 0, `the second run ended ${String(second.exit)}`);
    // Each run SAID its root, and the roots are DIFFERENT (one per run).
    assert.ok(first.tempRoot !== null, "the first run named no temporary root");
    assert.ok(second.tempRoot !== null, "the second run named no temporary root");
    assert.notEqual(first.tempRoot, second.tempRoot, "two runs must not share one root");
    // And the run's single exit path removed both (F154-FR-043).
    assert.equal(existsSync(first.tempRoot), false, "the first run's root survived the run");
    assert.equal(existsSync(second.tempRoot), false, "the second run's root survived the run");
    // The exports are lifted at the exit as well.
    assert.notEqual(process.env.TMPDIR, first.tempRoot);
    assert.notEqual(process.env.SPECSTRIDE_WORKER_TMPDIR, second.tempRoot);
  } finally {
    one.restore();
    two.restore();
  }
});

test("a stop ends the run `stop_flag` and its temporary root is removed", async () => {
  const ws = workspaceOfTheFixture();
  try {
    // THE STOP (F102's request, the file the `stop` surface writes): an
    // UNBOUND request in the run's inbox — the same mechanism the stop
    // tests use — planted before the launch, so the attempt's top reads it.
    const inbox = join(controlRootOfWorkspace(ws.dir), "inbox");
    mkdirSync(inbox, { recursive: true });
    writeFileSync(join(inbox, "stop.request"), "");
    const run = await runWithCapturedRoot(ws.dir);
    assert.equal(run.exit, 6, `the stopped run ended ${String(run.exit)}, not stop_flag`);
    assert.ok(
      run.said.includes("stop requested"),
      "the run did not say the stop it honoured",
    );
    assert.ok(run.tempRoot !== null, "the stopped run named no temporary root");
    assert.equal(existsSync(run.tempRoot), false, "the stopped run's root survived the run");
  } finally {
    ws.restore();
  }
});
