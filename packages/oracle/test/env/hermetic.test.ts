/**
 * CT-141-103 — the empty environment (T010, F141-FR-003).
 *
 * What the test proves:
 *
 * - only the allow-list reaches a run. The proof is a real child process: a
 *   variable of the machine is set in this process, a run is started with the
 *   environment the oracle builds, and the child prints its own `process.env`
 *   back. The variable is not in it, and the names the child saw are exactly
 *   the allow-list and the variables the fixture declared;
 * - the stubs stand first on the search path. The proof is a real lookup: an
 *   executable named `claude` is put both in the stub directory of the fixture
 *   and in a directory that stands in for a system directory, and
 *   `command -v claude` in a run resolves to the one in the stub directory;
 * - a fresh home and temporary directory per run: both exist on disk, are
 *   empty, lie under the run's own root, and two runs never share them;
 * - the port is driven by the same variables through the environment alias
 *   table of feature 100, annex X §X.8, which the oracle reads from
 *   `@specstride/contracts` and never copies.
 *
 * Nothing here calls a model, opens a socket or needs a credential (F141-FR-038).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { hermeticEnvironment as aliasTable } from "@specstride/contracts/profile/normalization";

import {
  CRITIC_STUB_DUMMY_KEY,
  ENVIRONMENT_ALLOW_LIST,
  FIXED_LOCALE,
  HermeticEnvironmentError,
  STUB_BIN,
  SYSTEM_PATH_DIRECTORIES,
  TICK_VARIABLES,
  aliasOfAsIsVariable,
  blanksTheDummyCriticKey,
  hermeticEnvironment,
  portEnvironment,
} from "../../src/env/hermetic.ts";

const made: string[] = [];
function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `oracle-${prefix}-`));
  made.push(dir);
  return dir;
}
process.on("exit", () => {
  for (const dir of made) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // nothing to do
    }
  }
});

/** A fixture directory with a stub directory in it, as a scenario has. */
function fixture(): string {
  const dir = temp("fixture");
  mkdirSync(join(dir, STUB_BIN));
  return dir;
}

/** A tiny executable, so the search-path order can be witnessed. */
function executable(dir: string, name: string, says: string): string {
  const file = join(dir, name);
  writeFileSync(file, `#!/bin/sh\necho ${says}\n`);
  chmodSync(file, 0o755);
  return file;
}

/** Start a real run with the given environment and give back what it saw. */
function run(env: Record<string, string>, script: string): string {
  return execFileSync("/bin/sh", ["-c", script], {
    encoding: "utf8",
    env,
    cwd: env["HOME"],
  }).trim();
}

// ---------------------------------------------------------------------------
// Only the allow-list reaches a run
// ---------------------------------------------------------------------------

test("CT-141-103: only the allow-list reaches a run", () => {
  // A variable of the machine, and one that holds a credential of a provider.
  process.env["ORACLE_TEST_MACHINE_VARIABLE"] = "this must not reach a run";
  process.env["ANTHROPIC_API_KEY"] = "sk-ant-a-credential-of-the-machine";
  try {
    const env = hermeticEnvironment({
      fixtureDir: fixture(),
      runRoot: temp("run"),
      criticStubAddress: "http://127.0.0.1:41411",
      declared: { SPECSTRIDE_MAX_ITER: "3", SPECSTRIDE_FEATURE: "141" },
    });

    // The names the oracle hands over are exactly the allow-list and what the
    // fixture declared — nothing else.
    const names = Object.keys(env.env).sort();
    const expected = [
      ...ENVIRONMENT_ALLOW_LIST,
      "SPECSTRIDE_MAX_ITER",
      "SPECSTRIDE_FEATURE",
    ].sort();
    assert.deepEqual(names, expected);

    // And a real run sees exactly those names, read back out of the child's
    // own `process.env` — an independent read path.
    const printed = run(
      env.env,
      `/usr/bin/env -0 2>/dev/null | tr '\\0' '\\n' | sed -n 's/=.*//p' | sort -u`,
    );
    const seen = printed
      .split("\n")
      .filter((n) => n !== "" && n !== "PWD" && n !== "SHLVL" && n !== "_");
    assert.deepEqual(seen.sort(), expected);

    assert.ok(
      !seen.includes("ORACLE_TEST_MACHINE_VARIABLE"),
      "no variable of the machine reaches a run",
    );
    // The credential variable of the machine did not reach the run with the
    // machine's value: the only key in a run is the oracle's dummy.
    assert.ok(!seen.includes("ANTHROPIC_API_KEY"));
    assert.equal(env.env["SPECSTRIDE_CLAUDE_CRITIC_API_KEY"], CRITIC_STUB_DUMMY_KEY);
    assert.equal(env.env["OPENAI_API_KEY"], CRITIC_STUB_DUMMY_KEY);
    assert.ok(!CRITIC_STUB_DUMMY_KEY.startsWith("sk-"));
  } finally {
    delete process.env["ORACLE_TEST_MACHINE_VARIABLE"];
    delete process.env["ANTHROPIC_API_KEY"];
  }
});

test("CT-141-103: the fixed values of the allow-list are set", () => {
  const env = hermeticEnvironment({
    fixtureDir: fixture(),
    runRoot: temp("run"),
    criticStubAddress: "http://127.0.0.1:41411",
  }).env;

  assert.equal(env["TZ"], "UTC");
  assert.equal(env["LANG"], FIXED_LOCALE);
  assert.equal(env["LC_ALL"], FIXED_LOCALE);
  // Colour off.
  assert.equal(env["NO_COLOR"], "1");
  assert.equal(env["CLICOLOR"], "0");
  assert.equal(env["TERM"], "dumb");
  // The two tick variables of the reference, set to 1.
  assert.deepEqual([...TICK_VARIABLES], ["SPECSTRIDE_WATCHDOG_TICK", "SPECSTRIDE_YIELD_POLL"]);
  for (const name of TICK_VARIABLES) assert.equal(env[name], "1");
  // No cache of the interpreter in the reference tree.
  assert.equal(env["PYTHONDONTWRITEBYTECODE"], "1");
  // An empty global and system configuration of the version-control tool, with
  // a fixed identity and fixed dates.
  assert.equal(env["GIT_CONFIG_GLOBAL"], "/dev/null");
  assert.equal(env["GIT_CONFIG_SYSTEM"], "/dev/null");
  assert.equal(env["GIT_AUTHOR_DATE"], env["GIT_COMMITTER_DATE"]);
  assert.match(env["GIT_AUTHOR_DATE"] ?? "", /^2026-01-01T00:00:00\+0000$/);
  assert.ok((env["GIT_AUTHOR_NAME"] ?? "") !== "");
  assert.ok((env["GIT_COMMITTER_EMAIL"] ?? "").endsWith(".invalid"));
  // The telemetry state directory is under the temporary directory of the run.
  assert.ok((env["SPECSTRIDE_OTEL_STATE_DIR"] ?? "").startsWith(env["TMPDIR"] ?? "\u0000"));
  // The address of the critic stub.
  assert.equal(env["SPECSTRIDE_CLAUDE_CRITIC_BASE_URL"], "http://127.0.0.1:41411");
  assert.equal(env["OPENAI_BASE_URL"], "http://127.0.0.1:41411");
});

test("CT-141-103: a declared variable that is not an as-is name of the alias table is refused", () => {
  assert.throws(
    () =>
      hermeticEnvironment({
        fixtureDir: fixture(),
        runRoot: temp("run"),
        criticStubAddress: "http://127.0.0.1:41411",
        declared: { SOMETHING_THE_PORT_CANNOT_RECEIVE: "1" },
      }),
    (error: unknown) => error instanceof HermeticEnvironmentError,
    "a fixture cannot smuggle a variable the port has no key for",
  );
});

test("CT-141-103: a fixture that declares a name the allow-list already sets is refused", () => {
  assert.throws(
    () =>
      hermeticEnvironment({
        fixtureDir: fixture(),
        runRoot: temp("run"),
        criticStubAddress: "http://127.0.0.1:41411",
        // An as-is name of the alias table that the allow-list also sets: it
        // passes the first check and is refused by the second.
        declared: { SPECSTRIDE_WATCHDOG_TICK: "5" },
      }),
    (error: unknown) =>
      error instanceof HermeticEnvironmentError && /already sets/.test(error.message),
    "a fixture does not change the empty environment itself",
  );
});

test("CT-141-103: a fixture whose subject is a missing credential blanks the dummy key, and only that", () => {
  // The one exception of F141-FR-003: the allow-list sets a dummy key for the
  // critic stub, so a scenario about a MISSING credential could not otherwise
  // exist. `spec.md` §O.2 names two (CQ-187).
  for (const name of ["SPECSTRIDE_CLAUDE_CRITIC_API_KEY", "OPENAI_API_KEY"]) {
    assert.equal(blanksTheDummyCriticKey(name, ""), true);
    const { env } = hermeticEnvironment({
      fixtureDir: fixture(),
      runRoot: temp("run"),
      criticStubAddress: "http://127.0.0.1:41411",
      declared: { [name]: "" },
    });
    assert.equal(env[name], "", `${name} reaches the run empty`);
    // The other key variable keeps the dummy value: a scenario takes one away.
    const other = name === "OPENAI_API_KEY" ? "SPECSTRIDE_CLAUDE_CRITIC_API_KEY" : "OPENAI_API_KEY";
    assert.equal(env[other], CRITIC_STUB_DUMMY_KEY);
  }

  // A value is never put in its place: that would be a credential (F141-FR-038).
  assert.equal(blanksTheDummyCriticKey("OPENAI_API_KEY", "sk-live-0"), false);
  assert.throws(
    () =>
      hermeticEnvironment({
        fixtureDir: fixture(),
        runRoot: temp("run"),
        criticStubAddress: "http://127.0.0.1:41411",
        declared: { OPENAI_API_KEY: "sk-live-0" },
      }),
    (error: unknown) =>
      error instanceof HermeticEnvironmentError && /already sets/.test(error.message),
  );
  // And no other name of the allow-list may be blanked either.
  assert.equal(blanksTheDummyCriticKey("HOME", ""), false);
});

// ---------------------------------------------------------------------------
// The stubs stand first on the search path
// ---------------------------------------------------------------------------

test("CT-141-103: the stub directory of the fixture stands before every system directory", () => {
  const fixtureDir = fixture();
  const systemDir = temp("system");
  executable(join(fixtureDir, STUB_BIN), "claude", "the-stub");
  executable(systemDir, "claude", "the-installed-harness");

  const env = hermeticEnvironment({
    fixtureDir,
    runRoot: temp("run"),
    criticStubAddress: "http://127.0.0.1:41411",
    systemPath: [systemDir, ...SYSTEM_PATH_DIRECTORIES],
  }).env;

  const parts = (env["PATH"] ?? "").split(":");
  assert.equal(parts[0], join(fixtureDir, STUB_BIN), "the stub directory is first");
  assert.ok(parts.indexOf(systemDir) > 0, "the system directory stands after it");
  for (const dir of SYSTEM_PATH_DIRECTORIES) {
    assert.ok(parts.indexOf(dir) > 0, `${dir} stands after the stub directory`);
  }

  // Witnessed by a real lookup in a real run.
  assert.equal(run(env, "command -v claude"), join(fixtureDir, STUB_BIN, "claude"));
  assert.equal(run(env, "claude"), "the-stub");
});

// ---------------------------------------------------------------------------
// A fresh home and temporary directory
// ---------------------------------------------------------------------------

test("CT-141-103: a fresh home, temporary directory and configuration, state and cache directories per run", () => {
  const fixtureDir = fixture();
  const first = hermeticEnvironment({
    fixtureDir,
    runRoot: temp("run-a"),
    criticStubAddress: "http://127.0.0.1:41411",
  });
  const second = hermeticEnvironment({
    fixtureDir,
    runRoot: temp("run-b"),
    criticStubAddress: "http://127.0.0.1:41411",
  });

  const fresh = [
    "HOME",
    "TMPDIR",
    "XDG_CONFIG_HOME",
    "XDG_STATE_HOME",
    "XDG_CACHE_HOME",
    "XDG_DATA_HOME",
    "XDG_RUNTIME_DIR",
  ] as const;

  for (const name of fresh) {
    const dir = first.env[name];
    assert.ok(dir !== undefined && dir !== "", `${name} is set`);
    // It exists on disk and it is fresh. The temporary directory of the run
    // holds the one thing F141-FR-003 puts there, the telemetry state
    // directory, and that one is empty too; every other directory is empty.
    assert.ok(existsSync(dir), `${name} exists on disk`);
    if (name === "TMPDIR") {
      assert.deepEqual(
        readdirSync(dir),
        ["otel-state"],
        "the run's temporary directory holds the telemetry state directory and nothing else",
      );
      assert.deepEqual(
        readdirSync(first.env["SPECSTRIDE_OTEL_STATE_DIR"] as string),
        [],
        "the telemetry state directory is empty",
      );
    } else {
      assert.deepEqual(readdirSync(dir), [], `${name} is empty`);
    }
    // It lies under the run's own root, not in the home of the machine.
    assert.ok(resolve(dir).startsWith(resolve(first.runRoot)), `${name} is under the run root`);
    assert.notEqual(dir, process.env[name], `${name} is not the one of the machine`);
    // And the next run gets another one.
    assert.notEqual(second.env[name], dir, `${name} is fresh per run`);
  }

  // The home the run gets is really the home a run writes into.
  assert.equal(run(first.env, 'printf %s "$HOME"'), first.env["HOME"]);
  assert.equal(run(first.env, 'cd "$HOME" && touch marker && printf %s ok'), "ok");
  assert.ok(existsSync(join(first.env["HOME"] ?? "", "marker")));
  // ... and it is not the home of the second run.
  assert.ok(!existsSync(join(second.env["HOME"] ?? "", "marker")));
});

// ---------------------------------------------------------------------------
// The port, through the alias table of feature 100
// ---------------------------------------------------------------------------

test("CT-141-103: the port receives the as-is variables through the alias table of feature 100", () => {
  // The table is read from `@specstride/contracts`, annex X §X.8, and never
  // copied into this package.
  assert.ok(aliasTable.length > 0);
  assert.equal(
    aliasTable.find((row) => row.variable === "SPECSTRIDE_MAX_ITER")?.key,
    "loop.maxIter",
  );
  assert.equal(aliasOfAsIsVariable("SPECSTRIDE_MAX_ITER"), "loop.maxIter");
  assert.equal(aliasOfAsIsVariable("SPECSTRIDE_FEATURE"), "spec.feature");
  assert.equal(aliasOfAsIsVariable("NOT_AN_AS_IS_VARIABLE"), undefined);

  const declared = { SPECSTRIDE_MAX_ITER: "3", SPECSTRIDE_FEATURE: "141" };
  const reference = hermeticEnvironment({
    fixtureDir: fixture(),
    runRoot: temp("run-ref"),
    criticStubAddress: "http://127.0.0.1:41411",
    declared,
  });
  const port = portEnvironment(reference);

  // The port is driven by the same variables: the environment is the same.
  assert.deepEqual(port.env, reference.env);
  // And each declared as-is variable arrives as the key the table names.
  assert.deepEqual(port.keys, {
    "loop.maxIter": "3",
    "spec.feature": "141",
  });
  for (const row of port.mapping) {
    assert.equal(
      aliasTable.find((entry) => entry.variable === row.variable)?.key,
      row.key,
      `${row.variable} maps as annex X §X.8 says`,
    );
  }
  // The mapping is the table of feature 100 and no table of this package.
  assert.equal(port.mappingSource, "@specstride/contracts/profile/normalization");
});
