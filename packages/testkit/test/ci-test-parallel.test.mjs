/**
 * CT-153-43 / CT-153-44: the repository's own suite runs its workspaces with a
 * bounded degree of parallelism fixed by the command, reports results in
 * workspace order, fails when any workspace fails, and keeps the isolation
 * prefix and the output cap the serial loop has. Serial (no argument) stays
 * byte-identical (the golden file).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseArgs,
  runOne,
  runOneCapped,
  runWorkspaces,
  blockOf,
} from "../../../scripts/ci-test-lib.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function aFakeRunOne(delayOf) {
  return async (item) => {
    await new Promise((resolve) => setTimeout(resolve, delayOf(item)));
    return { workspace: item.workspace ?? item, files: 1, status: 0, stdout: "", stderr: "" };
  };
}

test("CT-153-43 the degree is fixed by the command", () => {
  assert.deepEqual(parseArgs([]), { parallel: 1 });
  assert.deepEqual(parseArgs(["--parallel", "4"]), { parallel: 4 });
  for (const bad of [["--parallel", "0"], ["--parallel", "x"], ["--parallel"]]) {
    assert.throws(
      () => parseArgs(bad),
      (error) => /usage: node scripts\/ci-test\.mjs/.test(error.message),
      `--parallel ${JSON.stringify(bad)}`,
    );
  }
});

test("CT-153-43 never more than the degree at once", async () => {
  let running = 0;
  let peak = 0;
  const runOneItem = async (item) => {
    running += 1;
    peak = Math.max(peak, running);
    await new Promise((resolve) => setTimeout(resolve, 10));
    running -= 1;
    return { workspace: item, files: 1, status: 0, stdout: "", stderr: "" };
  };
  const items = Array.from({ length: 10 }, (_, i) => `packages/w${i}`);
  const three = await runWorkspaces(items, runOneItem, 3);
  assert.equal(peak, 3, `degree 3: peak was ${peak} (<= 3 required)`);
  assert.equal(three.length, 10);
  // Reset the counters before the degree-1 run: a pool that ignored the degree
  // and started every worker at once must fail the assertion below.
  running = 0;
  peak = 0;
  const one = await runWorkspaces(items, runOneItem, 1);
  assert.equal(one.length, 10);
  assert.equal(peak, 1, `degree 1: peak was ${peak} (exactly 1 required)`);
});

test("CT-153-44 results are in workspace order", async () => {
  // Workspaces later in the list finish first.
  const items = ["packages/slow-a", "packages/slow-b", "packages/slow-c"];
  const runOneItem = aFakeRunOne((item) =>
    item === "packages/slow-a" ? 60 : item === "packages/slow-b" ? 30 : 5,
  );
  const results = await runWorkspaces(items, (item) => runOneItem(item), 3);
  assert.deepEqual(
    results.map((r) => r.workspace),
    items,
  );
  const printed = results.map((r) => blockOf(r, 2)[0]);
  assert.deepEqual(printed, [
    "packages/slow-a: 1 files, exit 0",
    "packages/slow-b: 1 files, exit 0",
    "packages/slow-c: 1 files, exit 0",
  ]);
});

test("CT-153-43 one failure fails the suite", async () => {
  const items = Array.from({ length: 10 }, (_, i) => `packages/f${i}`);
  const runOneItem = async (item) => ({
    workspace: item,
    files: 1,
    status: item === "packages/f3" ? 1 : 0,
    stdout: item === "packages/f3" ? "not ok 1 - f3 fails\n" : "",
    stderr: "",
  });
  const results = await runWorkspaces(items, runOneItem, 4);
  assert.equal(results.filter((r) => r.status !== 0).length, 1);
  assert.equal(results.filter((r) => r.status === 0).length, 9, "the other nine still ran");
});

test("CT-153-43 isolation and the cap are kept", async (t) => {
  const root = mkdtempSync(join("/tmp", "ci-153-43-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  // Without tests/isolate.ts the argument list carries no isolate prefix.
  mkdirSync(join(root, "packages/one"), { recursive: true });
  let bareArgs;
  await runOne(root, "packages/one", ["a.test.mjs"], ({ args }) => {
    bareArgs = args;
  });
  assert.equal(bareArgs[0], "--test");

  // With tests/isolate.ts the prefix starts with it, as the serial loop builds it.
  mkdirSync(join(root, "tests"));
  writeFileSync(join(root, "tests/isolate.ts"), "process.exit(0);\n");
  let isolatedArgs;
  await runOne(root, "packages/one", ["a.test.mjs"], ({ args }) => {
    isolatedArgs = args;
  });
  assert.equal(isolatedArgs[0], join(root, "tests/isolate.ts"));
  assert.equal(isolatedArgs[1], process.execPath);
  assert.equal(isolatedArgs[2], "--test");

  // Output beyond the cap fails that workspace — and ends the child at the
  // moment the cap is crossed, not at the child's own exit (exercised through
  // the exported capped variant; runOne itself uses the 1 << 30 cap). A fresh
  // root: the fake isolate above would short-circuit the run.
  const capRoot = mkdtempSync(join("/tmp", "ci-153-43-cap-"));
  t.after(() => rmSync(capRoot, { recursive: true, force: true }));
  const big = join(capRoot, "packages/big/test");
  mkdirSync(big, { recursive: true });
  writeFileSync(join(capRoot, "packages/big/package.json"), '{"name":"big","type":"module"}\n');
  // A child that would never exit unprompted: it records its pid, then a
  // grandchild (holding the same pipes) records its pid and writes past any
  // small cap forever while the child idles. If the run did not end the group
  // at the cap, this call would not resolve until the guard timeout.
  const childPidFile = join(capRoot, "child.pid");
  const grandPidFile = join(capRoot, "grand.pid");
  writeFileSync(
    join(big, "loud.test.mjs"),
    'import { spawn } from "node:child_process";\n' +
      'import { writeFileSync } from "node:fs";\n' +
      `writeFileSync(${JSON.stringify(childPidFile)}, String(process.pid) + "\\n");\n` +
      "const grand = spawn(process.execPath, [\n" +
      '  "-e",\n' +
      "  " +
      JSON.stringify(
        `require("node:fs").writeFileSync(${JSON.stringify(grandPidFile)}, String(process.pid) + "\\n");` +
          'for (;;) process.stdout.write("y".repeat(4096) + "\\n");',
      ) +
      ",\n" +
      '], { stdio: ["ignore", "inherit", "inherit"] });\n' +
      "for (;;) await new Promise((resolve) => setTimeout(resolve, 1000));\n",
  );
  let capped;
  const guarded = await Promise.race([
    runOneCapped(capRoot, "packages/big", ["test/loud.test.mjs"], 1024).then((result) => {
      capped = result;
      return "resolved";
    }),
    new Promise((resolve) => setTimeout(() => resolve("guard-timeout"), 5000)),
  ]);
  assert.equal(guarded, "resolved", "the capped run did not end at the cap");
  assert.equal(capped.status, 1);
  assert.match(capped.stderr, /output exceeded/);
  // Both processes of the group the run ended are gone (kill(pid, 0) throws
  // ESRCH once a process is neither running nor a zombie).
  for (const pidFile of [childPidFile, grandPidFile]) {
    const pid = Number(readFileSync(pidFile, "utf8"));
    let gone = false;
    for (let i = 0; i < 100 && !gone; i += 1) {
      try {
        process.kill(pid, 0);
      } catch (error) {
        gone = error.code === "ESRCH";
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(gone, true, `pid ${pid} (${pidFile}) is still alive`);
  }
});

test("CT-153-43/44 serial is byte-identical", async (t) => {
  const root = mkdtempSync(join("/tmp", "ci-153-serial-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const layout = [
    [
      "packages/alpha",
      "a.test.mjs",
      'import test from "node:test";\ntest("alpha ok", () => {});\n',
    ],
    [
      "packages/beta",
      "b.test.mjs",
      'import test from "node:test";\ntest("beta fails", () => { throw new Error("beta fails"); });\n',
    ],
    [
      "packages/gamma",
      "g.test.mjs",
      'import test from "node:test";\ntest("gamma ok", () => {});\n',
    ],
  ];
  mkdirSync(join(root, "ci"), { recursive: true });
  writeFileSync(join(root, "ci/needs-specs.txt"), "");
  mkdirSync(join(root, "scripts"), { recursive: true });
  for (const [workspace, file, body] of layout) {
    mkdirSync(join(root, workspace, "test"), { recursive: true });
    writeFileSync(
      join(root, workspace, "package.json"),
      JSON.stringify({ name: workspace, type: "module", scripts: { test: "node --test test/" } }),
    );
    writeFileSync(join(root, workspace, "test", file), body);
  }
  const golden = readFileSync(
    join(repoRoot, "packages/testkit/test/fixtures/ci-test-serial.golden.txt"),
    "utf8",
  );
  // The current script, run with no argument, must reproduce the golden file
  // captured from the script as it was before this phase.
  writeFileSync(
    join(root, "scripts/ci-test.mjs"),
    readFileSync(join(repoRoot, "scripts/ci-test.mjs"), "utf8"),
  );
  writeFileSync(
    join(root, "scripts/ci-test-lib.mjs"),
    readFileSync(join(repoRoot, "scripts/ci-test-lib.mjs"), "utf8"),
  );
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // the script's own `node --test` children must not report to this runner
  const run = spawnSync(process.execPath, [join(root, "scripts/ci-test.mjs")], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 30,
    env,
  });
  assert.equal(run.stdout, golden);
  assert.equal(run.status, 1);
});
