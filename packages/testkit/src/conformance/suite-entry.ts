/**
 * T050 to T056 of feature 103 — the entry point a `node --test <directory>`
 * argument resolves to, for a folder of `src/conformance/`.
 *
 * ## Why this module exists
 *
 * The validation command of `specs/103-proposer-pass/quickstart.md` section 5,
 * which the phase gate of this feature executes verbatim, is
 *
 *     node --test packages/testkit/src/conformance/EP-04/ \
 *                 packages/testkit/src/conformance/EP-15/
 *
 * On the Node of this environment (v22.23.2) an explicit `--test` path that is a
 * DIRECTORY is not searched for test files: it is resolved as a MODULE and run
 * as the main entry point, so the command ends with `MODULE_NOT_FOUND` and exit
 * 1. That is a property of the Node binary and not of this repository — it
 * reproduces in a bare directory under `/tmp` holding one plain `*.test.js` file,
 * with no repository and no configuration in sight. The repository's own scripts
 * avoid it by passing a GLOB (`node --test "src/conformance/**\/*.test.*"`),
 * which works on this Node.
 *
 * So each such folder carries an `index.ts` that calls `runSuiteDirectory` and a
 * `package.json` naming it as `main` — Node's directory resolution looks for
 * `index.js`, `index.json` and `index.node` and never for `index.ts`, and
 * F100-FR-030 requires every source file of the product to be TypeScript. The
 * same device is already in `tests/characterization/103/` and
 * `tests/parity/103/`, written for the same reason in phase 2 of this feature.
 *
 * Nothing is skipped and nothing is reported that did not run: the child's TAP
 * output goes to this process's stdout and its exit code becomes this process's
 * exit code. A run whose TAP plan reports zero tests exits 70 instead of 0,
 * because a false green is worse than the failure this module exists to fix.
 *
 * ## Host safety
 *
 * The child is started through `tests/isolate.ts`, the wrapper this repository's
 * policy requires of anything that starts processes, so the suite runs in its own
 * PID namespace. This module signals nothing: it starts one child, waits for it,
 * and passes on its status. `tests/isolate.ts` is called and is not modified, and
 * `SPECSTRIDE_TEST_NO_ISOLATE` is never set.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

/** The repository root, five levels above `src/conformance/EP-nn/`. */
export function repositoryRootOf(directory: string): string {
  return join(directory, "..", "..", "..", "..", "..");
}

/**
 * Run every test file of one conformance folder over the glob form, and exit
 * with its status. `directoryUrl` is the `import.meta.url` of the folder's
 * `index.ts`.
 */
export function runSuiteDirectory(directoryUrl: string): never {
  const here = dirname(fileURLToPath(directoryUrl));
  const root = repositoryRootOf(here);
  const isolate = join(root, "tests", "isolate.ts");
  const pattern = `${relative(root, here).split("\\").join("/")}/**/*.test.ts`;

  /**
   * The child must not inherit the test context of the parent. When
   * `node --test` runs a file it sets `NODE_TEST_CONTEXT` in that file's
   * environment; a `node --test` CHILD that inherits it sees itself as already
   * inside a test context, prints "skipping running files", runs NOTHING and
   * still exits 0 — a false green. So every `NODE_TEST_*` variable is removed.
   */
  const childEnv = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith("NODE_TEST")),
  );

  const run = spawnSync(process.execPath, [isolate, process.execPath, "--test", pattern], {
    cwd: root,
    stdio: ["inherit", "pipe", "inherit"],
    env: childEnv,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  const tap = typeof run.stdout === "string" ? run.stdout : "";
  process.stdout.write(tap);

  if (run.error !== undefined && run.error !== null) {
    process.stderr.write(`${pattern}: the suite could not be started: ${run.error.message}\n`);
    process.exit(70);
  }
  const planned = /^# tests (\d+)$/m.exec(tap);
  const ran = planned === null ? 0 : Number(planned[1]);
  if (run.status === 0 && ran === 0) {
    process.stderr.write(
      `${pattern}: the suite exited 0 but ran no test at all. That is not a pass; ` +
        `the run is reported as a failure.\n`,
    );
    process.exit(70);
  }
  process.stderr.write(`${pattern}: ${String(ran)} test(s) run, status ${String(run.status)}\n`);
  process.exit(run.status === null ? 70 : run.status);
}
