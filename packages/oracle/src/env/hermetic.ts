/**
 * T011 — the empty environment with its allow-list, and the mapping through
 * the environment alias table of `@specstride/contracts` (F141-FR-003).
 *
 * Every run of the oracle, of the reference and of the port, starts from an
 * empty environment. `hermeticEnvironment` builds that environment from
 * nothing: it never reads `process.env`, so no variable of the machine can
 * reach a run, and what it returns is exactly `ENVIRONMENT_ALLOW_LIST` plus the
 * variables the fixture declares. The allow-list is the table of R18 O-2, which
 * F141-FR-003 states:
 *
 * - a search path on which the stub directory of the fixture stands before
 *   every system directory;
 * - a fresh home, temporary directory and configuration, state and cache
 *   directories per run;
 * - the time zone UTC and one fixed locale; colour off;
 * - the two tick variables of the reference set to 1;
 * - the telemetry state directory under the temporary directory of the run;
 * - an empty global and system configuration of the version-control tool with
 *   a fixed identity and fixed dates;
 * - the address of the critic stub and a dummy key;
 * - the variables the fixture declares.
 *
 * The port is driven by the same variables. The mapping is the environment
 * alias table of feature 100, annex X §X.8, which this module reads from
 * `@specstride/contracts/profile/normalization` and never copies: a fixture
 * declares an as-is variable, and `portEnvironment` says which key of the
 * configuration envelope it arrives as.
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { hermeticEnvironment as hermeticEnvironmentAliases } from "@specstride/contracts/profile/normalization";

import { DUMMY_CREDENTIAL, assertNoCredentialOfTheMachine } from "./guard.ts";

/** Where the stubs of a fixture stand (R18 O-2). */
export const STUB_BIN = "stub-bin" as const;

/** The system directories that stand after the stub directory on the search path. */
export const SYSTEM_PATH_DIRECTORIES = [
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
] as const;

/** One fixed locale, so sorting and messages do not move (R18 O-2). */
export const FIXED_LOCALE = "C.UTF-8" as const;

/** The two tick variables of the reference, set to 1 (R18 F-18). */
export const TICK_VARIABLES = ["SPECSTRIDE_WATCHDOG_TICK", "SPECSTRIDE_YIELD_POLL"] as const;

/** The fixed identity and the fixed dates of the version-control tool. */
export const GIT_IDENTITY = {
  name: "Oracle Fixture",
  email: "oracle@specstride.invalid",
  date: "2026-01-01T00:00:00+0000",
} as const;

/** The variables that carry the address of the critic stub. */
export const CRITIC_STUB_ADDRESS_VARIABLES = [
  "SPECSTRIDE_CLAUDE_CRITIC_BASE_URL",
  "OPENAI_BASE_URL",
] as const;

/** The variables that carry the dummy key of the critic stub. */
export const CRITIC_STUB_KEY_VARIABLES = [
  "SPECSTRIDE_CLAUDE_CRITIC_API_KEY",
  "OPENAI_API_KEY",
] as const;

/**
 * The dummy key of the critic stub. It is not a credential and it is not
 * secret: the stub never looks at it, and the credential guard allows these
 * two names to carry this one value and nothing else (F141-FR-038).
 */
export const CRITIC_STUB_DUMMY_KEY = DUMMY_CREDENTIAL;

/** The variables through which a stub finds its script, its counter and its transcript. */
export const STUB_VARIABLES = [
  "ORACLE_STUB_ROLE",
  "ORACLE_STUB_HARNESS",
  "ORACLE_STUB_SCRIPT",
  "ORACLE_STUB_SCRIPT_DIR",
  "ORACLE_STUB_STATE_DIR",
  "ORACLE_STUB_TRANSCRIPT",
  // T039, T044, T046: the scenario a harness stub reads recorded files from, the
  // map through which the argument `state` of `write` resolves a logical name to
  // the path of this side, and the feature the engine stub leaves its records
  // under. All three are paths of the run and hold no value of the machine.
  "ORACLE_FIXTURE_DIR",
  "ORACLE_STATE_PATHS",
  "ORACLE_ENGINE_FEATURE",
] as const;

/**
 * The allow-list of F141-FR-003: every name a run may see, apart from what the
 * fixture declares. No other variable of the machine reaches a run.
 */
export const ENVIRONMENT_ALLOW_LIST = [
  "PATH",
  "HOME",
  "TMPDIR",
  "XDG_CONFIG_HOME",
  "XDG_STATE_HOME",
  "XDG_CACHE_HOME",
  "XDG_DATA_HOME",
  "XDG_RUNTIME_DIR",
  "TZ",
  "LANG",
  "LC_ALL",
  "NO_COLOR",
  "CLICOLOR",
  "TERM",
  "PYTHONDONTWRITEBYTECODE",
  ...TICK_VARIABLES,
  "SPECSTRIDE_OTEL_STATE_DIR",
  "GIT_CONFIG_GLOBAL",
  "GIT_CONFIG_SYSTEM",
  "GIT_AUTHOR_NAME",
  "GIT_AUTHOR_EMAIL",
  "GIT_AUTHOR_DATE",
  "GIT_COMMITTER_NAME",
  "GIT_COMMITTER_EMAIL",
  "GIT_COMMITTER_DATE",
  ...CRITIC_STUB_ADDRESS_VARIABLES,
  ...CRITIC_STUB_KEY_VARIABLES,
  ...STUB_VARIABLES,
] as const;

/** An environment the oracle refuses to hand to a run. */
export class HermeticEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HermeticEnvironmentError";
  }
}

/**
 * The as-is variables of the environment alias table of feature 100, annex X
 * §X.8. Read from `@specstride/contracts` and never copied into this package.
 */
export const AS_IS_VARIABLES: readonly string[] = Object.freeze(
  hermeticEnvironmentAliases.map((row) => row.variable),
);

/**
 * The key of the configuration envelope an as-is variable is an alias of, or
 * `undefined` when the table does not name the variable. A row whose `Key`
 * cell says in words that the variable maps to no key gives the empty string,
 * which is what the table itself records.
 */
export function aliasOfAsIsVariable(variable: string): string | undefined {
  const row = hermeticEnvironmentAliases.find((entry) => entry.variable === variable);
  return row === undefined ? undefined : row.key;
}

/** The pattern of an as-is variable the table names with a placeholder. */
function matchesTemplatedAlias(variable: string): boolean {
  return hermeticEnvironmentAliases.some((row) => {
    if (!row.variable.includes("<") && !row.variable.endsWith("*")) return false;
    const expression = new RegExp(
      `^${row.variable
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/<[^>]*>/g, "[A-Z0-9_]+")
        .replace(/\*/g, "[A-Z0-9_]*")}$`,
    );
    return expression.test(variable);
  });
}

export type HermeticEnvironmentOptions = {
  /** The directory of the scenario; its `stub-bin` stands first on the search path. */
  readonly fixtureDir: string;
  /** The root of this run: the fresh directories are made under it. */
  readonly runRoot: string;
  /** The address of the critic stub, which must be loopback. */
  readonly criticStubAddress: string;
  /** The variables the fixture declares, by as-is name. */
  readonly declared?: Readonly<Record<string, string>>;
  /** The system directories of the search path; the default is `SYSTEM_PATH_DIRECTORIES`. */
  readonly systemPath?: readonly string[];
  /**
   * Where the stub executables of this run are linked, and what stands first on the
   * search path. The default is the `stub-bin` of the fixture, which both sides share.
   * The PORT side is given one of its own, because the set of stubs that may shadow a
   * command differs there: the as-is engine command is the name of the product's own
   * front door, so it never stands on the port's search path (F141-FR-004).
   */
  readonly stubBinDir?: string;
};

/** The environment of one run, and the directories it was given. */
export type HermeticEnvironment = {
  readonly env: Record<string, string>;
  readonly runRoot: string;
  readonly fixtureDir: string;
  readonly stubBin: string;
  /** The as-is variables the fixture declared. */
  readonly declared: Readonly<Record<string, string>>;
};

/**
 * Whether a declaration takes the dummy key of the critic stub away. The only
 * name of the allow-list a fixture may declare, and the only value it may give
 * it: a critic-key variable set to the empty string, which is how the baseline
 * reads "no credential" (`if not key` of the critic module at `9cab15d`,
 * line 1882, and line 2363 for the OpenAI-compatible provider).
 */
export function blanksTheDummyCriticKey(variable: string, value: string): boolean {
  return (CRITIC_STUB_KEY_VARIABLES as readonly string[]).includes(variable) && value === "";
}

/**
 * Build the environment of one run from nothing. `process.env` is never read,
 * so no variable of the machine can reach a run (F141-FR-003) and no
 * credential of the machine can either (F141-FR-038).
 */
export function hermeticEnvironment(options: HermeticEnvironmentOptions): HermeticEnvironment {
  const fixtureDir = resolve(options.fixtureDir);
  const runRoot = resolve(options.runRoot);
  const stubBin =
    options.stubBinDir === undefined ? join(fixtureDir, STUB_BIN) : resolve(options.stubBinDir);
  const declared = options.declared ?? {};

  // The address of the critic stub is loopback, and the guard says so.
  const host = /^[a-z]+:\/\/([^/:]+)/.exec(options.criticStubAddress)?.[1];
  if (host === undefined) {
    throw new HermeticEnvironmentError(
      `the address of the critic stub ${JSON.stringify(options.criticStubAddress)} is no address`,
    );
  }

  // A fixture declares as-is variables. One the alias table does not name
  // could not reach the port at all, so the fixture is refused here rather
  // than compared against a port that never saw it (F141-FR-003).
  for (const name of Object.keys(declared)) {
    if (aliasOfAsIsVariable(name) === undefined && !matchesTemplatedAlias(name)) {
      throw new HermeticEnvironmentError(
        `the fixture declares ${name}, which the environment alias table of feature 100, ` +
          `annex X §X.8 does not name. The port is driven by the same variables through that ` +
          `table, so a variable outside it has no key and cannot reach the port (F141-FR-003)`,
      );
    }
    if ((ENVIRONMENT_ALLOW_LIST as readonly string[]).includes(name)) {
      // One exception, and one value: a fixture whose subject is a MISSING
      // credential blanks the dummy key of the critic stub. The allow-list
      // sets that key, so without this the condition could not be expressed
      // at all, and `spec.md` §O.2 names two scenarios that are about it
      // (`FX-07/missing-key`, `FX-07/codex-missing-key`; CQ-187). The empty
      // string is the only value allowed: the fixture may take the key away
      // and may not put another one in its place, so no credential enters a
      // run through a declaration (F141-FR-038).
      if (blanksTheDummyCriticKey(name, declared[name])) continue;
      throw new HermeticEnvironmentError(
        `the fixture declares ${name}, which the allow-list of the run already sets; a fixture ` +
          `does not change the empty environment itself (F141-FR-003)`,
      );
    }
  }

  // A fresh home, temporary directory and configuration, state and cache
  // directories, per run, made on disk here so a run finds them empty.
  const fresh = (name: string): string => {
    const dir = join(runRoot, name);
    mkdirSync(dir, { recursive: true });
    return dir;
  };
  const home = fresh("home");
  const tmp = fresh("tmp");
  const otelStateDir = join(tmp, "otel-state");
  mkdirSync(otelStateDir, { recursive: true });

  const env: Record<string, string> = {
    // The stub directory of this side stands before every system directory.
    PATH: [stubBin, ...(options.systemPath ?? SYSTEM_PATH_DIRECTORIES)].join(":"),
    HOME: home,
    TMPDIR: tmp,
    XDG_CONFIG_HOME: fresh("config"),
    XDG_STATE_HOME: fresh("state"),
    XDG_CACHE_HOME: fresh("cache"),
    XDG_DATA_HOME: fresh("data"),
    XDG_RUNTIME_DIR: fresh("runtime"),
    // The time zone UTC and one fixed locale.
    TZ: "UTC",
    LANG: FIXED_LOCALE,
    LC_ALL: FIXED_LOCALE,
    // Colour off.
    NO_COLOR: "1",
    CLICOLOR: "0",
    TERM: "dumb",
    // No cache of the interpreter in the reference tree.
    PYTHONDONTWRITEBYTECODE: "1",
    // The telemetry state directory under the temporary directory of the run.
    SPECSTRIDE_OTEL_STATE_DIR: otelStateDir,
    // An empty global and system configuration of the version-control tool,
    // with a fixed identity and fixed dates.
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_AUTHOR_NAME: GIT_IDENTITY.name,
    GIT_AUTHOR_EMAIL: GIT_IDENTITY.email,
    GIT_AUTHOR_DATE: GIT_IDENTITY.date,
    GIT_COMMITTER_NAME: GIT_IDENTITY.name,
    GIT_COMMITTER_EMAIL: GIT_IDENTITY.email,
    GIT_COMMITTER_DATE: GIT_IDENTITY.date,
    // The stub kit: a stub finds its script, its counter and its transcript
    // outside the working directory through these.
    ORACLE_STUB_ROLE: "",
    ORACLE_STUB_HARNESS: "",
    ORACLE_STUB_SCRIPT: join(fixtureDir, "fixture.json"),
    ORACLE_STUB_SCRIPT_DIR: fresh("stub-scripts"),
    ORACLE_STUB_STATE_DIR: fresh("stub-state"),
    ORACLE_STUB_TRANSCRIPT: join(fresh("transcript"), "transcript.jsonl"),
    ORACLE_FIXTURE_DIR: fixtureDir,
    ORACLE_STATE_PATHS: join(fresh("state-paths"), "state-paths.json"),
    ORACLE_ENGINE_FEATURE: "",
  };
  // The two tick variables of the reference, set to 1.
  for (const name of TICK_VARIABLES) env[name] = "1";
  // The address of the critic stub and a dummy key.
  for (const name of CRITIC_STUB_ADDRESS_VARIABLES) env[name] = options.criticStubAddress;
  for (const name of CRITIC_STUB_KEY_VARIABLES) env[name] = CRITIC_STUB_DUMMY_KEY;
  // And the variables the fixture declares.
  for (const [name, value] of Object.entries(declared)) env[name] = value;

  // Nothing beyond the allow-list and the declaration got in.
  const allowed = new Set<string>([...ENVIRONMENT_ALLOW_LIST, ...Object.keys(declared)]);
  for (const name of Object.keys(env)) {
    if (!allowed.has(name)) {
      throw new HermeticEnvironmentError(
        `${name} is neither on the allow-list nor declared by the fixture`,
      );
    }
  }
  for (const name of ENVIRONMENT_ALLOW_LIST) {
    if (!(name in env))
      throw new HermeticEnvironmentError(
        `the allow-list names ${name} and the run would not see it`,
      );
  }
  // No credential of the machine is in it (F141-FR-038).
  assertNoCredentialOfTheMachine(env);

  return Object.freeze({
    env,
    runRoot,
    fixtureDir,
    stubBin,
    declared: Object.freeze({ ...declared }),
  });
}

/** One as-is variable and the key of the envelope it arrives as on the port. */
export type AliasRow = { readonly variable: string; readonly key: string; readonly value: string };

/** The environment of the port side, and how its variables arrive there. */
export type PortEnvironment = {
  readonly env: Record<string, string>;
  /** Per declared as-is variable: the key of feature 110 it is an alias of. */
  readonly mapping: readonly AliasRow[];
  /** The keys, as the configuration envelope of the port receives them. */
  readonly keys: Readonly<Record<string, string>>;
  /** Where the mapping comes from; the oracle owns no table of its own. */
  readonly mappingSource: "@specstride/contracts/profile/normalization";
};

/**
 * The port side of a run: the same variables, and what each declared as-is
 * variable means as a key of the configuration envelope — through the
 * environment alias table of feature 100, annex X §X.8 (F141-FR-003).
 */
export function portEnvironment(reference: HermeticEnvironment): PortEnvironment {
  const mapping: AliasRow[] = [];
  for (const [variable, value] of Object.entries(reference.declared)) {
    const key = aliasOfAsIsVariable(variable);
    if (key === undefined) {
      throw new HermeticEnvironmentError(
        `${variable} is no as-is variable of the alias table of annex X §X.8, so the port has ` +
          `no key for it (F141-FR-003)`,
      );
    }
    mapping.push(Object.freeze({ variable, key, value }));
  }
  return Object.freeze({
    env: reference.env,
    mapping: Object.freeze(mapping),
    keys: Object.freeze(Object.fromEntries(mapping.map((row) => [row.key, row.value]))),
    mappingSource: "@specstride/contracts/profile/normalization",
  });
}
