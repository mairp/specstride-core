/**
 * The test step of CI: every test file of every workspace, apart from those in
 * ci/needs-specs.txt. Each workspace runs in its own process, as under `npm test`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const excluded = new Set(
  readFileSync(join(root, "ci/needs-specs.txt"), "utf8")
    .split("\n")
    .filter((line) => line !== "" && !line.startsWith("#")),
);
const workspaces = ["packages", "tools"].flatMap((group) =>
  globSync(`${group}/*/package.json`, { cwd: root }).map((file) => dirname(file)),
);

/**
 * Workspaces whose tests start and signal real process groups (parallel
 * attempts, worker supervisors, commit-gate stubs) are run two files at a
 * time: under the runner's default concurrency those files blow each other's
 * timing windows — the failure is load, not behavior (2026-11-13: the
 * phase-7 verification gate of feature 152-commit-backpressure failed four
 * attempts in a row on exactly these two files, each of them passing alone).
 * `packages/core` joins them (2026-11-13, attempt 21): the wall-clock budget
 * test CT-152-12b failed once under the full suite's load while passing
 * alone, for the same reason — the gate decides in a few hundred
 * milliseconds, but the measured run can be preempted when every core is
 * already running another test file.
 */
const CAPPED_CONCURRENCY = new Set(["packages/cli", "packages/core"]);

let failed = 0;
for (const workspace of workspaces.sort()) {
  const manifest = JSON.parse(readFileSync(join(root, workspace, "package.json"), "utf8"));
  if (manifest.scripts?.test === undefined) continue;
  const files = globSync("**/*.test.{ts,mjs}", {
    cwd: join(root, workspace),
    exclude: (name) => name === "node_modules" || name === ".build" || name === "fixtures",
  }).filter((file) => !excluded.has(join(workspace, file)));
  if (files.length === 0) continue;
  const isolate = join(root, "tests/isolate.ts");
  const prefix = existsSync(isolate) ? [isolate, process.execPath] : [];
  const concurrency = CAPPED_CONCURRENCY.has(workspace) ? ["--test-concurrency=2"] : [];
  const run = spawnSync(process.execPath, [...prefix, "--test", ...concurrency, ...files], {
    cwd: join(root, workspace),
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
    maxBuffer: 1 << 30,
  });
  const notOk = run.stdout.split("\n").filter((line) => /^not ok/.test(line));
  console.log(`${workspace}: ${files.length} files, exit ${String(run.status)}`);
  for (const line of notOk) console.log(`  ${line}`);
  if (run.status !== 0) failed += 1;
}
process.exit(failed === 0 ? 0 : 1);
