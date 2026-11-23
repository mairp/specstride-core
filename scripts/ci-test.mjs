/**
 * The test step of CI: every test file of every workspace, apart from those in
 * ci/needs-specs.txt. Each workspace runs in its own process, as under `npm test`.
 *
 * `--parallel <n>` runs at most <n> workspaces at a time; the results are still
 * printed in workspace order and a failure anywhere fails the suite. With no
 * argument the run is exactly as it was before parallelism existed (serial).
 */
import { spawnSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, runOne, runWorkspaces, blockOf } from "./ci-test-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const parallel = parseArgs(process.argv.slice(2)).parallel;
const excluded = new Set(
  readFileSync(join(root, "ci/needs-specs.txt"), "utf8")
    .split("\n")
    .filter((line) => line !== "" && !line.startsWith("#")),
);
const workspaces = ["packages", "tools"].flatMap((group) =>
  globSync(`${group}/*/package.json`, { cwd: root }).map((file) => dirname(file)),
);

const items = [];
for (const workspace of workspaces.sort()) {
  const manifest = JSON.parse(readFileSync(join(root, workspace, "package.json"), "utf8"));
  if (manifest.scripts?.test === undefined) continue;
  const files = globSync("**/*.test.{ts,mjs}", {
    cwd: join(root, workspace),
    exclude: (name) => name === "node_modules" || name === ".build" || name === "fixtures",
  }).filter((file) => !excluded.has(join(workspace, file)));
  if (files.length === 0) continue;
  items.push({ workspace, files });
}

let failed = 0;
if (parallel === 1) {
  for (const { workspace, files } of items) {
    const isolate = join(root, "tests/isolate.ts");
    const prefix = existsSync(isolate) ? [isolate, process.execPath] : [];
    const run = spawnSync(process.execPath, [...prefix, "--test", ...files], {
      cwd: join(root, workspace),
      stdio: ["ignore", "pipe", "inherit"],
      encoding: "utf8",
      maxBuffer: 1 << 30,
    });
    const lines = run.stdout.split("\n");
    const notOk = lines.filter((line) => /^not ok/.test(line));
    console.log(`${workspace}: ${files.length} files, exit ${String(run.status)}`);
    for (const line of notOk) console.log(`  ${line}`);
    if (run.status !== 0) {
      // A bare name is not a diagnosis: the TAP detail block under each failing
      // test carries the assertion's message and stack. Print it on stderr —
      // stdout is contract: the parity test of ci-test-parallel compares it
      // byte-for-byte — capped, so a red CI run explains itself.
      let printed = 0;
      let capturing = false;
      for (const line of lines) {
        if (/^not ok/.test(line)) {
          capturing = true;
          continue;
        }
        if (!capturing) continue;
        if (/^(ok |not ok |# |1\.\.|# Subtest)/.test(line)) {
          capturing = false;
          continue;
        }
        if (printed < 400) {
          console.error(`  ${line}`);
          printed += 1;
        }
      }
    }
    if (run.status !== 0) failed += 1;
  }
} else {
  const results = await runWorkspaces(
    items,
    (item) => runOne(root, item.workspace, item.files),
    parallel,
  );
  for (const result of results) {
    for (const line of blockOf(result, parallel)) console.log(line);
    if (result.status !== 0) failed += 1;
  }
}
process.exit(failed === 0 ? 0 : 1);
