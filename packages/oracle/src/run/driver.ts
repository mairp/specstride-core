/**
 * T046 — the driver of one side (F141-FR-004, F141-FR-012, F141-FR-019).
 *
 * One side of one scenario, from the empty environment to the capture:
 *
 * 1. a fresh run root, and the hermetic environment of F141-FR-003 built from
 *    nothing (`src/env/hermetic.ts`);
 * 2. the working directory from the template of the scenario, and every file of
 *    state of the template laid out BY ITS LOGICAL NAME for this side — the as-is
 *    path on the reference, the path the layout tables of feature 100 give on the
 *    port (F141-FR-012). The same resolution is written to a map file, which is
 *    the path the argument `state` of the proposer verb `write` resolves to;
 * 3. the `stub-bin` of the side: one link per stub executable of
 *    `packages/oracle/stubs/bin/`, so the stubs stand before every system
 *    directory on the search path, and one script file per role of the scenario;
 * 4. for the PORT: the named profile `parity` of feature 100, annex X §X.7,
 *    selected by ORDINARY CONFIGURATION, and nothing the profile or the fixture
 *    does not name. Where the fixture needs the engine stub it is named through
 *    the switch of ROW 41 of the profile (`engine.executable`) and through the
 *    search path, and through no switch of the oracle's own (F141-FR-004);
 * 5. the steps of commands, in order, each with its standard output and standard
 *    error captured apart as bytes;
 * 6. the processes the run left behind, LISTED BEFORE the capture is taken
 *    (F141-FR-019).
 *
 * The driver never runs a model, never reaches a network beyond loopback and
 * never writes to a source repository: the two guards are installed before the
 * first command (F141-FR-038), and the reference is a read-only tree in scratch.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  lutimesSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import process from "node:process";

import { profileRow, profileRows } from "@specstride/contracts/profile/parity";
import { componentNameOf } from "@specstride/contracts/profile/layout-old-side";

import { ORACLE_ROOT } from "../index.ts";
import { ASSETS_DIRECTORY } from "../catalogue/fixture.ts";
import { editedReferenceTree, referenceEditsOf } from "../reference/edits.ts";
import {
  captureSurfaces,
  type Capture,
  type CaptureContext,
  type CommandRecord,
  type ProcessLeftBehind,
} from "../capture/index.ts";
import {
  layOutStateFile,
  splitTemplateStateName,
  stateFilesOfTemplate,
  type FixtureDeclaration,
} from "../catalogue/fixture.ts";
import { hermeticEnvironment, portEnvironment } from "../env/hermetic.ts";
import { ENGINE_SWITCH_KEY, ENGINE_SWITCH_ROW } from "../../stubs/lib/engine.ts";
import { engineExecutableName, stubExecutableNames } from "../../stubs/lib/names.ts";
import { componentFiles } from "../normalize/text.ts";
import { STATE_PATH_VARIABLE } from "../../stubs/lib/state-paths.ts";
import { SERVER_STUB_ADDRESS_FILE } from "../../stubs/critic-http/server.ts";
import { CRITIC_STUB_ADDRESS_VARIABLES } from "../env/hermetic.ts";
import { TERMINAL_COLUMNS, TERMINAL_ROWS, runOnPseudoTerminal } from "./pty.ts";
import {
  backgroundQueryAnswer,
  entryPointFile,
  isFx40EntryPoint,
  resolveStepArgv,
} from "./entry-points.ts";
import { applyOwnerDecisions } from "./decisions.ts";

/** The named profile of feature 100 the port runs under (F141-FR-004). */
export const PARITY_PROFILE = "parity" as const;

/** Where the configuration that selects the profile is written, inside the run's own config home. */
export const PORT_CONFIGURATION_FILE = join("specstride", "config.json");

/** The switch of the profile through which the engine stub is named, and its row. */
export { ENGINE_SWITCH_KEY, ENGINE_SWITCH_ROW };

/** `packages/oracle/stubs/bin/`. */
export const STUB_BIN_SOURCE = join(ORACLE_ROOT, "stubs", "bin");

/** A side that could not be driven. */
export class DriverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriverError";
  }
}

/** Why a side could not be run at all; the comparison is then a skip with its reason. */
export type SideUnavailable = { readonly side: string; readonly reason: string };

/**
 * The parameters a file of state of a TEMPLATE stands at (F141-FR-012).
 *
 * A logical name of the layout table of feature 100 is a template: `gate:<N>:approved`
 * names the approval marker of ANY phase. A working-directory template holds one file
 * per logical name, so an indexed name in a template stands for the FIRST index — phase
 * 1, attempt 1, the one run of the scenario. A scenario that needs a second index plants
 * it with a step of the run, never with the template. The same values are given to the
 * as-is path of the reference and to the layout table of the port, so the two sides of
 * one template name the same thing.
 */
export const TEMPLATE_STATE_PARAMETERS: Readonly<Record<string, string | number>> = Object.freeze({
  N: 1,
  M: 1,
  k: 1,
  n: 1,
  attempt: 1,
  phase: 1,
  time: "000000-000000",
});

/** The placeholders an as-is path of the compared table of feature 100 carries. */
export function resolveAsIsPlaceholders(
  path: string,
  options: {
    readonly workdir: string;
    readonly slug: string;
    readonly runId?: string;
    readonly parameters?: Readonly<Record<string, string | number>>;
  },
): string {
  let resolved = path;
  const parameter = (name: string, fallback: string): string =>
    options.parameters?.[name] === undefined ? fallback : String(options.parameters[name]);
  for (const [from, to] of [
    ["<workdir>", options.workdir],
    ["<state-dir>", ".specstride"],
    ["<state>", ".specstride"],
    ["<slug>", options.slug],
    ["<feature-dir>", join(".specstride", "features", options.slug)],
    ["<feature>", join(".specstride", "features", options.slug)],
    ["<FEATURE_DIR>", join(".specstride", "features", options.slug)],
    ["<run-id>", options.runId ?? "run"],
    ["<run_id>", options.runId ?? "run"],
    ["<run id>", options.runId ?? "run"],
    ["<N>", parameter("N", "1")],
    ["<M>", parameter("M", "1")],
    ["<k>", parameter("k", "1")],
    ["<n>", parameter("n", "1")],
    ["<time>", parameter("time", "000000-000000")],
  ] as const) {
    resolved = resolved.split(from).join(to);
  }
  return resolved.startsWith("/") ? resolved : join(options.workdir, resolved);
}

/**
 * The path every file of state of the template resolves to on one side
 * (F141-FR-012). This map is the state surface's key set, and it is the map the
 * argument `state` of the proposer verb `write` resolves through.
 */
export function resolveStatePaths(
  logicalNames: readonly string[],
  side: "reference" | "port",
  options: {
    readonly workdir: string;
    readonly slug: string;
    readonly runId?: string;
    readonly roots?: Readonly<Record<string, string>>;
    readonly parameters?: Readonly<Record<string, string | number>>;
  },
): Readonly<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const name of logicalNames) {
    // An entry of a template may name the INSTANCE it stands at after a `#`
    // (`run:<runId>:events-legacy#runId=…`). The parameters of the instance stand
    // over the defaults of a template, on both sides.
    const { logicalName, parameters } = splitTemplateStateName(name);
    const resolvedParameters = { ...(options.parameters ?? {}), ...parameters };
    const laid = layOutStateFile(logicalName, side, {
      ...(options.roots === undefined ? {} : { roots: options.roots }),
      parameters: resolvedParameters,
    });
    map[name] =
      side === "reference"
        ? resolveAsIsPlaceholders(laid, {
            ...options,
            parameters: resolvedParameters,
            ...(resolvedParameters["runId"] === undefined
              ? {}
              : { runId: String(resolvedParameters["runId"]) }),
          })
        : resolve(laid.startsWith("/") ? laid : join(options.workdir, laid));
  }
  return Object.freeze(map);
}

/** Lay the working directory out from the template of the scenario. */
export function layOutWorkdir(templateDir: string, workdir: string): void {
  mkdirSync(workdir, { recursive: true });
  if (!existsSync(templateDir)) return;
  for (const entry of readdirSync(templateDir)) {
    // The directory of the files of state is not part of the tree: each of its
    // files goes to the path its logical name resolves to on this side.
    if (entry === "state") continue;
    cpSync(join(templateDir, entry), join(workdir, entry), { recursive: true });
  }
}

/** Lay every file of state of the template out at the path of this side. */
export function layOutState(
  templateDir: string,
  statePaths: Readonly<Record<string, string>>,
): readonly string[] {
  const written: string[] = [];
  const stateDir = join(templateDir, "state");
  for (const [name, path] of Object.entries(statePaths)) {
    const source = join(stateDir, name);
    if (!existsSync(source)) continue;
    mkdirSync(dirname(path), { recursive: true });
    cpSync(source, path, { recursive: true });
    written.push(path);
  }
  return Object.freeze(written);
}

/**
 * The names of the stub executables that stand on the search path of one side.
 *
 * On the reference: every one of them. The as-is engine command of
 * `stub-vocabulary.json` IS the front door of the Specstride baseline, which the
 * mixture-of-loops baseline calls as its engine, so the stub has to answer to that
 * name there.
 *
 * On the PORT that same name is the name of the product's OWN command line, and a
 * link to the engine stub in front of it would mean every scenario whose port
 * command is the product's front door ran the oracle's stub instead of the product
 * — the oracle compared against itself. The port therefore never gets that link:
 * where a fixture needs the engine stub on the port, the named profile `parity`
 * names it by path through ROW 41 and through nothing else (F141-FR-004).
 */
/**
 * The gap, in seconds, between the newest file a scenario's layout planted and the
 * first command of the run. The no-progress breaker of the reference asks
 * `find -newermt @$(( $(date +%s) - 1 ))` whether the pass that just ended changed
 * anything inside the working directory (`proposer.sh`, `_disk_progress_since`).
 * Its window reaches ONE SECOND BACK from the start of the pass, so a layout that
 * finished inside that second is read as the work of pass 1 and the breaker stays
 * silent; a layout that finished a moment earlier makes it fire. That is a race
 * between the oracle's own file writes and the clock, and it made every scenario
 * whose stub writes nothing outside the state directory (FX-19, FX-21
 * `progress-stall`) capture differently from one run of one side to the next.
 */
/**
 * Create every state root of this side that lies inside the working directory, for a
 * scenario whose pass loop can run.
 *
 * The no-progress breaker of the reference asks `find "$WORKDIR" … -newermt` whether
 * anything changed, and `find` tests the starting point itself: creating a directory
 * directly inside the working directory moves the working directory's own mtime. The
 * state directory (`.specstride`) is pruned from the walk but the ACT of making it is
 * not, so a run that made it in its own first pass reported progress there and a run
 * whose first pass began a second later did not — the pass sequence of every scenario
 * whose passes write nothing (FX-19, `FX-21/progress-stall`) then differed between two
 * runs of ONE side. Making it part of the layout, which `backdateLayout` then
 * backdates with everything else, settles that for good.
 *
 * Only a scenario that declares a PROPOSER stub gets it: the breaker lives in the pass
 * loop and the pass loop runs for no other scenario, and every scenario that does run it
 * makes that directory itself in any case, so no surface gains an entry that the
 * behaviour under test would not have left there anyway.
 */
export function createStateRootsInsideTheWorkdir(
  roots: Readonly<Record<string, string>>,
  workdir: string,
  stubs: unknown,
): readonly string[] {
  if ((stubs as Record<string, unknown> | undefined)?.["proposer"] === undefined) return [];
  const made: string[] = [];
  const inside = `${resolve(workdir)}/`;
  for (const root of Object.values(roots)) {
    const path = resolve(root);
    if (path === resolve(workdir) || !path.startsWith(inside)) continue;
    if (existsSync(path)) continue;
    mkdirSync(path, { recursive: true });
    made.push(path);
  }
  return Object.freeze(made);
}

export const LAYOUT_SETTLE_SECONDS = 3;

/**
 * Backdate everything a scenario's layout planted so that the newest of it is
 * exactly `LAYOUT_SETTLE_SECONDS` before now, and nothing the run itself writes can
 * be confused with it.
 *
 * Every path is shifted by the SAME amount, so the relative age of two planted files
 * is exactly what the fixture laid down — a scenario that plants a result older than
 * its sources (`FX-16/pre-staged-stale`, `FX-33/stale-sources`, `FX-34/stale`) keeps
 * that order. No mtime is part of any surface (`capture/tree.ts` records path, type,
 * mode, link target and content, never a time), so this is invisible to the
 * comparison and visible only to the reference's own freshness tests.
 */
export function backdateLayout(roots: readonly string[], now = Date.now()): number {
  const paths: string[] = [];
  const walk = (path: string): void => {
    let stat;
    try {
      stat = lstatSync(path);
    } catch {
      return;
    }
    paths.push(path);
    if (!stat.isDirectory()) return;
    for (const name of readdirSync(path)) walk(join(path, name));
  };
  for (const root of roots) walk(root);
  if (paths.length === 0) return 0;
  let newest = 0;
  for (const path of paths) {
    const at = lstatSync(path).mtimeMs;
    if (at > newest) newest = at;
  }
  const target = now - LAYOUT_SETTLE_SECONDS * 1000;
  const shift = target - newest;
  if (shift >= 0) return 0;
  for (const path of paths) {
    const stat = lstatSync(path);
    const seconds = (stat.mtimeMs + shift) / 1000;
    try {
      lutimesSync(path, seconds, seconds);
    } catch {
      // A path that vanished between the walk and here is not part of the layout.
    }
  }
  return shift;
}

export function stubExecutablesOfSide(side: "reference" | "port"): readonly string[] {
  const engine = engineExecutableName();
  return Object.freeze(stubExecutableNames().filter((n) => side !== "port" || n !== engine));
}

/** The two variants F141-FR-016 gives every scenario of FX-35 and FX-36. */
export const ENGINE_STUB_VARIANT = "@engine-stub" as const;
export const FULL_STACK_VARIANT = "@full-stack" as const;

/**
 * The baseline whose own front door answers the as-is engine command on the
 * REFERENCE side of this scenario, or `undefined` when the engine stub does.
 *
 * F141-FR-016 asks every scenario of FX-35 and FX-36 to run twice: as
 * `@engine-stub`, where row 41 of the parity profile names the engine stub and the
 * launcher, the pipeline runtime and the supervisor are the only thing under test;
 * and as `@full-stack`, "against the real engine with agent stubs". The families are
 * of the mixture-of-loops baseline and the engine it drives is Specstride, so the
 * real engine of the reference side is a SECOND reference tree — the one the
 * scenario names here. The declaration carries it rather than the variant name alone,
 * so a reader of `fixture.json` sees which tree the run needs, and `engineRoot` of
 * `DriveOptions` is where the caller hands that tree in.
 */
export function engineSystemOf(fixture: Readonly<Record<string, unknown>>): string | undefined {
  const declared = fixture["engineSystem"];
  if (declared === undefined) return undefined;
  if (typeof declared !== "string" || declared.length === 0) {
    throw new DriverError("`engineSystem` of a scenario must be the name of a reference system");
  }
  if (declared === String(fixture["system"] ?? "specstride")) {
    throw new DriverError(
      `the scenario declares engineSystem ${declared}, which is its own system; the real ` +
        `engine of a scenario is the baseline the scenario DRIVES and never the baseline it is of`,
    );
  }
  if (fixture["variant"] !== FULL_STACK_VARIANT) {
    throw new DriverError(
      `only the ${FULL_STACK_VARIANT} variant of a scenario reaches the real engine ` +
        `(F141-FR-016); this scenario declares engineSystem ${declared} and variant ` +
        `${String(fixture["variant"])}`,
    );
  }
  return declared;
}

/**
 * Where the as-is engine command of the REFERENCE side points: the engine stub, or
 * the front door of the engine's own baseline for a `@full-stack` scenario.
 *
 * The link carries the whole difference between the two variants, so the launch
 * contract of both holds the same bare command name and no path of a tree.
 */
export function engineTargetOfTheReferenceSide(options: {
  readonly fixture: Readonly<Record<string, unknown>>;
  readonly engineRoot?: string;
}): string | undefined {
  const system = engineSystemOf(options.fixture);
  if (system === undefined) return undefined;
  if (options.engineRoot === undefined) {
    throw new DriverError(
      `the scenario declares engineSystem ${system} and no reference tree of that system was ` +
        `handed in; the ${FULL_STACK_VARIANT} variant runs against the real engine ` +
        `(F141-FR-016) and cannot fall back to the engine stub`,
    );
  }
  const front = join(resolve(options.engineRoot), engineExecutableName());
  if (!existsSync(front)) {
    throw new DriverError(
      `${front} does not exist; the front door of the ${system} baseline is what answers the ` +
        `as-is engine command on the reference side of a ${FULL_STACK_VARIANT} scenario`,
    );
  }
  return front;
}

/**
 * The `stub-bin` of one side: one link per stub executable of that side, so every
 * stub stands before every system directory on the search path and the SAME file
 * serves both sides (§O.3, rule 3).
 */
export function buildStubBin(
  stubBin: string,
  source: string = STUB_BIN_SOURCE,
  side: "reference" | "port" = "reference",
  engineTarget?: string,
): readonly string[] {
  mkdirSync(stubBin, { recursive: true });
  const linked: string[] = [];
  const engine = engineExecutableName();
  for (const name of stubExecutablesOfSide(side)) {
    // `@full-stack`: the as-is engine command is the real engine and not the stub
    // (F141-FR-016). Nothing else of the set changes.
    if (name === engine && engineTarget !== undefined) {
      linked.push(linkTheRealEngine(stubBin, name, engineTarget));
      continue;
    }
    const target = join(source, name);
    if (!existsSync(target)) {
      throw new DriverError(
        `${target} does not exist; the stub executables are generated from the names of ` +
          `stub-vocabulary.json (T044)`,
      );
    }
    const link = join(stubBin, name);
    // A link that already points somewhere else is re-pointed: the two variants of
    // one scenario link the same name at two different targets, and the reference
    // side's `stub-bin` is a directory of the fixture that survives the run. The
    // link is relative, so a committed fixture resolves in every checkout.
    let existing: string | undefined;
    try {
      existing = resolve(stubBin, readlinkSync(link));
    } catch {
      existing = undefined;
    }
    if (existing !== undefined && existing !== resolve(target)) rmSync(link);
    if (existing === undefined || existing !== resolve(target)) {
      symlinkSync(relative(stubBin, target), link);
    }
    linked.push(link);
  }
  return Object.freeze(linked);
}

/**
 * How the real engine answers the as-is engine command of a `@full-stack` run: a
 * two-line wrapper, and not a link.
 *
 * The front door of the Specstride baseline reads its own directory as
 * `dirname "${BASH_SOURCE[0]}"` and sources its own shell library and the script of
 * the pass loop beside it (`specstride:57-60` at `9cab15d`). Bash does not
 * resolve a symlink there, so a link in the run's `stub-bin` would make the front
 * door look for its own library inside `stub-bin` and exit 127 — found live on
 * `FX-35/stages-complete@full-stack`. A wrapper that execs the front door by its
 * own path is what leaves `BASH_SOURCE` pointing into the tree. The engine stub is
 * still a link: it is a Node file and reads nothing beside itself.
 */
export function linkTheRealEngine(stubBin: string, name: string, target: string): string {
  const file = join(stubBin, name);
  if (existsSync(file) || isALink(file)) rmSync(file, { force: true });
  writeFileSync(
    file,
    `#!/bin/sh\n` +
      `# The real engine of a @full-stack scenario (F141-FR-016), reached under the as-is\n` +
      `# engine command. A link would break the front door's own reading of its directory.\n` +
      `exec ${JSON.stringify(target)} "$@"\n`,
    { encoding: "utf8", mode: 0o755 },
  );
  return file;
}

/** Whether a path is a link, dangling or not. */
function isALink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/** Write one script file per role the scenario scripts, into the run's script directory. */ /** Write one script file per role the scenario scripts, into the run's script directory. */
export function writeStubScripts(
  scriptDir: string,
  stubs: Readonly<
    Record<string, readonly { readonly verbs: readonly string[]; readonly args?: unknown }[]>
  >,
): readonly string[] {
  mkdirSync(scriptDir, { recursive: true });
  const written: string[] = [];
  for (const [kind, steps] of Object.entries(stubs)) {
    const file = join(scriptDir, `${kind}.json`);
    writeFileSync(file, `${JSON.stringify({ steps }, null, 1)}\n`, "utf8");
    written.push(file);
  }
  return Object.freeze(written);
}

/**
 * The configuration of the PORT side: the named profile `parity`, selected by
 * ordinary configuration, and nothing the profile or the fixture does not name
 * (F141-FR-004). Where the fixture needs the engine stub, row 41 names it.
 */
export function portConfiguration(options: {
  readonly engineStub?: string;
  readonly declaredKeys?: Readonly<Record<string, string>>;
}): Readonly<Record<string, unknown>> {
  const configuration: Record<string, unknown> = { profile: PARITY_PROFILE };
  if (options.engineStub !== undefined) {
    const row = profileRow(ENGINE_SWITCH_ROW);
    if (row === undefined || !row.keys.includes(ENGINE_SWITCH_KEY)) {
      throw new DriverError(
        `row ${String(ENGINE_SWITCH_ROW)} of the parity profile names ` +
          `${(row?.keys ?? []).join(", ")} and not ` +
          `${ENGINE_SWITCH_KEY}; the oracle names the engine stub through that row and through no ` +
          `switch of its own (F141-FR-004)`,
      );
    }
    configuration[ENGINE_SWITCH_KEY] = options.engineStub;
  }
  for (const [key, value] of Object.entries(options.declaredKeys ?? {})) configuration[key] = value;
  assertNothingBeyondTheProfileOrTheFixture(configuration, options.declaredKeys ?? {});
  return Object.freeze(configuration);
}

/** Where the refusals of `denyMachineImplementations` are written, under the run root. */
export const PATH_GUARD = "path-guard" as const;

/** The exit code a refusal gives: as far as the run is concerned there is no such command. */
export const NO_SUCH_COMMAND = 127 as const;

/**
 * No implementation installed on the MACHINE may answer a run (F141-FR-003,
 * F141-FR-038).
 *
 * The search path of a run holds the stub directory of its side first and then the
 * system directories, which a development machine may well have an as-is command
 * installed into — this one has `/usr/local/bin/specstride`, a wrapper that executes
 * the Specstride baseline out of a live clone. While every as-is name was linked into
 * one shared `stub-bin` that stood first, the stub hid it; the port no longer links
 * the as-is engine command (`stubExecutablesOfSide`), so without this the port of a
 * scenario would reach the machine's own baseline, read a source repository the oracle
 * never archived, and be compared as though it were the product.
 *
 * So every as-is name this side does NOT stub is refused by a file of its own, placed
 * after the stub directory and before every system directory: it writes why on
 * standard error and exits `NO_SUCH_COMMAND`. A side that stubs every name gets no
 * directory and no change to its search path.
 */
export function denyMachineImplementations(
  runRoot: string,
  side: "reference" | "port",
): { readonly dir: string | undefined; readonly refused: readonly string[] } {
  const stubbed = new Set(stubExecutablesOfSide(side));
  const refused = stubExecutableNames().filter((name) => !stubbed.has(name));
  if (refused.length === 0) return { dir: undefined, refused: Object.freeze([]) };
  const dir = join(runRoot, PATH_GUARD);
  mkdirSync(dir, { recursive: true });
  for (const name of refused) {
    const file = join(dir, name);
    writeFileSync(
      file,
      `#!/usr/bin/env node
` +
        `// Written by denyMachineImplementations of packages/oracle/src/run/driver.ts.
` +
        `// ${name} is an as-is command of stub-vocabulary.json that the ${side} side does not
` +
        `// stub. No implementation installed on the machine may answer a run (F141-FR-003).
` +
        `process.stderr.write(
` +
        `  ${JSON.stringify(
          `${name}: no such command in the hermetic environment of the oracle. It is an as-is ` +
            `command that the ${side} side does not stub, and nothing installed on the machine ` +
            `may answer a run (F141-FR-003).
`,
        )},
` +
        `);
` +
        `process.exit(${String(NO_SUCH_COMMAND)});
`,
      { mode: 0o755 },
    );
  }
  return { dir, refused: Object.freeze(refused) };
}

/** Where the product's own commands are linked on the PORT's search path. */
export const PRODUCT_BIN = "product-bin" as const;

/** The package of the product that carries the command line (CLI protocol 1). */
export const PRODUCT_COMMAND_PACKAGE = join("packages", "cli");

/** What the manifest of the product's command line says it can run. */
export type ProductCommandLine = {
  /** The file of each executable the manifest names, by the name a caller types. */
  readonly executables: Readonly<Record<string, string>>;
  /** The commands of CLI protocol 1 this build actually has, as a caller writes them. */
  readonly commands: readonly string[];
};

/**
 * The product's command line, read off `packages/cli/package.json` and nothing else.
 *
 * Two members of that manifest decide what the PORT can be driven on: `bin`, which
 * names the executable, and `specstride.commands`, which names the commands of CLI
 * protocol 1 the build has. The oracle reads them; it never guesses from the presence
 * of a file and never asks the product for anything of its own (F141-FR-004).
 */
export function productCommandLine(root: string): ProductCommandLine | undefined {
  const manifest = join(resolve(root), PRODUCT_COMMAND_PACKAGE, "package.json");
  if (!existsSync(manifest)) return undefined;
  const parsed = JSON.parse(readFileSync(manifest, "utf8")) as {
    bin?: unknown;
    name?: unknown;
    specstride?: { commands?: unknown };
  };
  const bin = parsed.bin;
  const executables: Record<string, string> = {};
  if (typeof bin === "string") {
    executables[String(parsed.name ?? "").replace("@specstride/", "")] = bin;
  } else if (bin !== null && typeof bin === "object") {
    for (const [name, file] of Object.entries(bin as Record<string, unknown>)) {
      if (typeof file === "string") executables[name] = file;
    }
  }
  const declared = parsed.specstride?.commands;
  const commands = Array.isArray(declared) ? declared.filter((c) => typeof c === "string") : [];
  return Object.freeze({
    executables: Object.freeze(executables),
    commands: Object.freeze(commands as string[]),
  });
}

/**
 * The `product-bin` of the PORT: one link per executable the product's manifest
 * names, in a directory of its own under the run root.
 *
 * It stands AFTER the stub directory and BEFORE the refusals of
 * `denyMachineImplementations`, so three things hold at once: a stub of the scenario
 * still shadows a name it stubs (§O.3, rule 3); the product's own front door answers
 * its own name on the port; and an implementation installed on the MACHINE never
 * does, because the refusal is still there behind it (F141-FR-003). The reference
 * side gets no such directory — it is driven out of the read-only tree in scratch.
 */
export function buildProductBin(
  runRoot: string,
  implementationRoot: string,
): { readonly dir: string | undefined; readonly linked: readonly string[] } {
  const line = productCommandLine(implementationRoot);
  const names = Object.entries(line?.executables ?? {}).filter(([, file]) =>
    existsSync(join(resolve(implementationRoot), PRODUCT_COMMAND_PACKAGE, file)),
  );
  if (names.length === 0) return { dir: undefined, linked: Object.freeze([]) };
  const dir = join(runRoot, PRODUCT_BIN);
  mkdirSync(dir, { recursive: true });
  const linked: string[] = [];
  for (const [name, file] of names) {
    const link = join(dir, name);
    if (!existsSync(link)) {
      symlinkSync(join(resolve(implementationRoot), PRODUCT_COMMAND_PACKAGE, file), link);
    }
    linked.push(link);
  }
  return { dir, linked: Object.freeze(linked) };
}

/**
 * The value row 41 of the profile carries on the PORT side.
 *
 * A bare name would be looked up on the search path, and the as-is engine command
 * does not stand on the port's search path (`stubExecutablesOfSide`), because that
 * name is the name of the product's own front door. Row 41 therefore names the
 * engine stub BY PATH there, which is the one way the stub reaches the port
 * (F141-FR-004).
 */
export function engineStubForThePort(name: string): string {
  return name.includes("/") ? name : join(STUB_BIN_SOURCE, name);
}

/** Every key of the `parity` profile, which is the only set the oracle may set. */
export function parityProfileKeys(): readonly string[] {
  return Object.freeze(profileRows.flatMap((row) => [...row.keys]));
}

/**
 * "The oracle … MUST set nothing that the profile or the fixture does not name"
 * (F141-FR-004). `profile` itself is the ordinary selection of the profile.
 */
export function assertNothingBeyondTheProfileOrTheFixture(
  configuration: Readonly<Record<string, unknown>>,
  declaredKeys: Readonly<Record<string, string>>,
): void {
  const named = new Set<string>(["profile", ...parityProfileKeys(), ...Object.keys(declaredKeys)]);
  for (const key of Object.keys(configuration)) {
    if (!named.has(key)) {
      throw new DriverError(
        `the oracle would set ${key}, which neither the parity profile of feature 100 nor the ` +
          `fixture names (F141-FR-004)`,
      );
    }
  }
}

/**
 * The processes of one process group, with the state the kernel gives each
 * (`ps` `stat=`). The one reading of the machine that `listProcessesLeftBehind`
 * and `pidsOfTheGroup` share.
 */
function psOfGroup(
  processGroup: number,
): readonly { readonly pid: number; readonly state: string; readonly command: string }[] {
  const result = spawnSync("ps", ["-eo", "pid=,pgid=,stat=,args="], { encoding: "utf8" });
  if (result.status !== 0) return [];
  const rows: { pid: number; state: string; command: string }[] = [];
  for (const line of result.stdout.split("\n")) {
    const match = /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/.exec(line);
    if (match === null) continue;
    const pid = Number(match[1]);
    if (Number(match[2]) !== processGroup) continue;
    // The oracle's own two: this process, and the `ps` it has just spawned to
    // make this very list. Neither is a process of the run.
    if (pid === process.pid || pid === result.pid) continue;
    rows.push({ pid, state: match[3] as string, command: match[4] ?? "" });
  }
  return Object.freeze(rows);
}

/**
 * The pids of the process group that are alive BEFORE the first command of a
 * scenario runs. Everything in the group that is already there belongs to
 * whatever started the oracle — a shell job, a pipeline of the capture job, a
 * test runner — and not to the run, so the run cannot be said to have left it
 * behind.
 */
export function pidsOfTheGroup(processGroup: number): ReadonlySet<number> {
  return new Set(psOfGroup(processGroup).map((row) => row.pid));
}

/**
 * The processes the run left behind (§O.4, S-08). Listed BEFORE the capture is
 * taken (F141-FR-019): a process of the run's own process group that is still
 * alive after the last command ended.
 *
 * Three kinds of process are in that group and are NOT what this surface is
 * about, and each of them would make the surface depend on how the capture was
 * invoked rather than on what the run did:
 *
 * - the oracle's own processes: this one, and the `ps` it spawns to make the
 *   list (`psOfGroup` drops both);
 * - a process that was already alive when the run started (`alreadyThere`): the
 *   shell job, the pipeline of the capture job, the test runner;
 * - a ZOMBIE, state `Z`: a child that has already ended and is waiting to be
 *   reaped by the oracle's own driver process. It is not alive, and the zombies
 *   of a long-lived driver ACCUMULATE, so counting them would make the capture of
 *   a scenario depend on how many scenarios ran before it in the same process.
 */
export function listProcessesLeftBehind(
  processGroup: number,
  alreadyThere: ReadonlySet<number> = new Set(),
): readonly ProcessLeftBehind[] {
  const left: ProcessLeftBehind[] = [];
  for (const row of psOfGroup(processGroup)) {
    if (alreadyThere.has(row.pid) || row.state.startsWith("Z")) continue;
    left.push({ pid: row.pid, processGroup, command: row.command.split(/\s+/) });
  }
  return Object.freeze(left);
}

/**
 * The two stubs of §O.3 that are SERVERS, not commands: the critic stub over
 * HTTP and the telemetry sink stub. Each runs in its OWN process, started by the
 * driver before the first command of the scenario and stopped after the last
 * one, because a server in the driver's own process could never answer a call
 * from a command the driver waits for.
 */
export const SERVER_STUBS = Object.freeze({
  "critic-http": join(ORACLE_ROOT, "stubs", "critic-http", "server.ts"),
  "telemetry-sink": join(ORACLE_ROOT, "stubs", "sink", "server.ts"),
});
export type ServerStubKind = keyof typeof SERVER_STUBS;

/** A server stub of this run, with the address it actually bound. */
export type ServerStub = {
  readonly kind: ServerStubKind;
  readonly address: string;
  readonly pid: number;
  stop: () => void;
};

/** How long the driver waits for a server stub to say it is listening. */
export const SERVER_STUB_WAIT_MILLISECONDS = 20_000;

/** Wait without reading a clock in a loop of syscalls: one blocking sleep per tick. */
function sleepMilliseconds(milliseconds: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

/**
 * Start one server stub as its own process and wait for the address it bound.
 * The handshake is the file named by `ORACLE_SERVER_ADDRESS_FILE`, which the
 * stub writes LAST: it exists only once the socket is listening, so the run is
 * never pointed at a port nothing answers.
 */
export function startServerStub(options: {
  readonly kind: ServerStubKind;
  readonly runRoot: string;
  readonly env: Readonly<Record<string, string>>;
  readonly extraEnv?: Readonly<Record<string, string>>;
}): ServerStub {
  const addressFile = join(options.runRoot, "server-stubs", `${options.kind}.address`);
  mkdirSync(dirname(addressFile), { recursive: true });
  rmSync(addressFile, { force: true });
  const child = spawn(
    process.execPath,
    ["--experimental-strip-types", SERVER_STUBS[options.kind]],
    {
      env: { ...options.env, ...options.extraEnv, [SERVER_STUB_ADDRESS_FILE]: addressFile },
      cwd: options.runRoot,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    },
  );
  let diagnosis = "";
  child.stderr.on("data", (chunk: Buffer) => void (diagnosis += chunk.toString("utf8")));
  child.stdout.resume();
  const tick = 25;
  for (let waited = 0; waited < SERVER_STUB_WAIT_MILLISECONDS; waited += tick) {
    if (existsSync(addressFile)) {
      const address = readFileSync(addressFile, "utf8").trim();
      return {
        kind: options.kind,
        address,
        pid: child.pid ?? 0,
        stop: (): void => {
          child.kill("SIGTERM");
        },
      };
    }
    if (child.exitCode !== null) break;
    sleepMilliseconds(tick);
  }
  child.kill("SIGKILL");
  throw new DriverError(
    `the ${options.kind} stub did not say it was listening: ${diagnosis.slice(0, 2000)}`,
  );
}

/** One step of commands of a scenario. */
/**
 * One command of a scenario. `boundedSeconds` is for a command of the reference that
 * does not end on its own — `specstride tail` ends in `tail -f`, which follows the log
 * for as long as it is let to. The scenario says how long it is let to; the capture
 * then records the signal that ended it, which is what the reference does and what the
 * port will have to do. The bound is a span, not a clock: nothing of it reaches a run.
 */
export type Step = {
  readonly argv: readonly string[];
  /** T157: the FX-40 entry point this step drives, where it names one. */
  readonly entryPoint?: string;
  readonly entryPointArguments?: Record<string, string[]>;
  readonly resumeCause?: string;
  readonly boundedSeconds?: number;
};

/** What the driver was asked to do. */
export type DriveOptions = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  readonly suite?: "first" | "second";
  readonly fixtureDir: string;
  readonly runRoot: string;
  /** The declaration of the scenario (`fixture.json`). */
  readonly fixture: FixtureDeclaration & Readonly<Record<string, unknown>>;
  /** The root of the side: the read-only reference tree, or the repository of the port. */
  readonly implementationRoot: string;
  /** The address of the critic stub of this run; it is loopback. */
  readonly criticStubAddress: string;
  /** The feature slug the run leaves its state under. */
  readonly slug?: string;
  /** Where the telemetry sink stub stores its payloads, where the scenario names one. */
  readonly telemetryStore?: string;
  /** The name of the engine stub where the fixture needs one (row 41). */
  readonly engineStub?: string;
  /**
   * The read-only reference tree of the baseline the scenario declares as
   * `engineSystem`: the real engine of a `@full-stack` scenario (F141-FR-016).
   */
  readonly engineRoot?: string;
  /** One surface to seed a difference in, for the self-proof (F141-FR-044). */
  readonly seedDifference?: string;
  /**
   * T081, T082 — variables the CAPTURE JOB adds on top of the hermetic
   * environment, and nothing else does: the line tracing of F141-FR-031. They
   * are an overlay rather than entries of `ENVIRONMENT_ALLOW_LIST` because a run
   * of either suite must see neither of them, and because a capture made with
   * tracing has to equal one made without (CT-141-131). The overlay is applied
   * after `hermeticEnvironment`, so the allow-list still decides what a plain run
   * sees.
   */
  readonly traceOverlay?: Readonly<Record<string, string>>;
  /**
   * T141 — the configuration the oracle adds ON TOP of the selected profile,
   * for the second suite: row 1 of the `parity` profile set to `micro`, and
   * nothing else. Only keys the profile names may stand here, which the driver
   * checks; the fixture cannot reach this field, so a fixture can never set a
   * profile key of its own through it.
   */
  readonly configurationOverlay?: Readonly<Record<string, string>>;
};

/** What one side of one scenario left behind. */
export type DriveResult = {
  readonly capture: Capture;
  readonly commands: readonly CommandRecord[];
  readonly workdir: string;
  readonly runRoot: string;
  readonly env: Readonly<Record<string, string>>;
  readonly statePaths: Readonly<Record<string, string>>;
  /** The root of the fixture, which N-01 needs as a named root (`<FIXTURE>`). */
  readonly fixtureDir: string;
  /** For the port: the configuration that selected the profile `parity`. */
  readonly configuration?: Readonly<Record<string, unknown>>;
  readonly processesLeftBehind: readonly ProcessLeftBehind[];
};

/**
 * The placeholder a fixture uses to name an as-is implementation by its LOGICAL
 * component name: `<IMPL>/<component:pipeline-runtime>` instead of the file name of
 * the baseline. F100-FR-026 reserves five of those file names to
 * `packages/contracts/data/layout-old-side.json`, and a scenario that named one
 * would carry a copy of it; the component-name table of feature 100 is what resolves
 * it here, which is the same table N-15 normalizes with.
 */
export const COMPONENT_PLACEHOLDER = /<component:([a-z0-9-]+)>/g;

/** The file of the reference tree a `<component:…>` placeholder names. */
export function resolveComponentPlaceholders(argument: string, system: string): string {
  return argument.replace(COMPONENT_PLACEHOLDER, (whole, logical: string) => {
    const files = componentFiles()
      .filter((row) => row.system === system)
      .flatMap((row) => row.files.map((file) => ({ file, asIs: row.asIs })))
      .filter(({ asIs }) => componentNameOf(asIs) === logical)
      .map(({ file }) => file);
    // The row gives its files in the order of the baseline, the LOCATED form of
    // each (with its directory) before the bare name a message of the baseline
    // uses. The command of a scenario wants the located form of the first file.
    const found = files.find((file) => file.includes("/")) ?? files[0];
    if (found === undefined) {
      throw new DriverError(
        `the scenario names ${whole}, and the component-name table of feature 100 gives no file of ` +
          `the ${system} baseline for the component ${logical}`,
      );
    }
    return found;
  });
}

/** The command of one step, with the placeholders of the declaration resolved. */
export function resolveArgv(
  argv: readonly string[],
  places: Readonly<Record<string, string>>,
): readonly string[] {
  return Object.freeze(
    argv.map((a) => {
      let text = a;
      for (const [name, value] of Object.entries(places)) text = text.split(name).join(value);
      return text;
    }),
  );
}

/**
 * Drive one side of one scenario and capture the surfaces the fixture names.
 * Nothing of the machine reaches the run: the environment is built from nothing
 * and the guards are installed in every stub process.
 */
export function driveSide(options: DriveOptions): DriveResult {
  // Nothing is laid out, spawned or captured for a side that a declared missing
  // prerequisite says is not there (F141-FR-037).
  refuseToDriveAnUnavailableSide(options);
  const slug = options.slug ?? "default";
  const runRoot = resolve(options.runRoot);
  mkdirSync(runRoot, { recursive: true });

  const fixtureDir = resolve(options.fixtureDir);
  // A scenario whose behaviour the SHIPPED registry of the baseline cannot reach
  // (a declared overlay, a routed stream format) runs on a private writable COPY
  // of the reference tree with its as-is edits applied. The pinned tree is only
  // read, so `checkTreeUnchanged` still passes after the run (F141-FR-002). The
  // copy is thrown away with the run root.
  const edits = options.side === "reference" ? referenceEditsOf(options.fixture) : [];
  const implementationRoot =
    edits.length === 0
      ? resolve(options.implementationRoot)
      : editedReferenceTree({
          referenceRoot: options.implementationRoot,
          destination: join(runRoot, "edited-reference"),
          edits,
          assetsDirectory: ASSETS_DIRECTORY,
        }).root;
  const declared = (options.fixture.environment ?? {}) as Record<string, string>;
  // The port is given a `stub-bin` of its own under the run root: the set of names
  // that may shadow a command differs by side (`stubExecutablesOfSide`), and the
  // shared `stub-bin` of the fixture cannot hold two sets at once.
  const hermetic = hermeticEnvironment({
    fixtureDir,
    runRoot,
    criticStubAddress: options.criticStubAddress,
    declared,
    ...(options.side === "port" ? { stubBinDir: join(runRoot, "stub-bin") } : {}),
  });
  const env: Record<string, string> = { ...hermetic.env, ...(options.traceOverlay ?? {}) };

  // The working directory, and every file of state of the template by its
  // logical name on THIS side (F141-FR-012).
  const workdir = join(runRoot, "work");
  const templateDir = join(fixtureDir, String(options.fixture.workdirTemplate ?? "workdir"));
  layOutWorkdir(templateDir, workdir);
  // Every logical name the scenario names: the files of state the template plants,
  // and the names the argument `state` of a stub verb writes. A scenario that makes a
  // file of state DURING the run (the stop request of FX-12) plants none, and the
  // name still has to resolve per side and still has to be a key of the surface.
  const logicalNames = [
    ...new Set([
      ...stateFilesOfTemplate(templateDir),
      ...stateNamesOfStubScripts(options.fixture.stubs),
    ]),
  ];
  const stateRoots: Record<string, string> = {
    "<workspace>": workdir,
    "<workspace-part>": join(workdir, ".specstride"),
    "<control>": join(env["XDG_STATE_HOME"] as string, "specstride", "workspaces", slug),
    "<user-config>": join(env["XDG_CONFIG_HOME"] as string, "specstride"),
    "<user-state>": join(env["XDG_STATE_HOME"] as string, "specstride", "user"),
    "<user-cache>": join(env["XDG_CACHE_HOME"] as string, "specstride"),
    "<temp>": env["TMPDIR"] as string,
  };
  const statePaths = resolveStatePaths(logicalNames, options.side, {
    workdir,
    slug,
    roots: stateRoots,
    parameters: { ...TEMPLATE_STATE_PARAMETERS, slug, runId: "run" },
  });
  layOutState(templateDir, statePaths);
  // Every state root of this side that lies INSIDE the working directory is part of
  // the layout, whether or not the template plants a file in it. A directory created
  // inside the working directory DURING the run moves the mtime of the working
  // directory itself, and the working directory is the one path the no-progress
  // breaker of the reference tests directly, so a run that makes its own state
  // directory reports progress in its first pass and a run that found it already
  // there does not (`backdateLayout`).
  createStateRootsInsideTheWorkdir(stateRoots, workdir, options.fixture.stubs);

  // The map the argument `state` of the proposer verb `write` resolves through.
  const mapFile = env[STATE_PATH_VARIABLE] as string;
  mkdirSync(dirname(mapFile), { recursive: true });
  writeFileSync(mapFile, `${JSON.stringify(statePaths, null, 1)}\n`, "utf8");

  // The stubs: one link per executable, and one script file per role. On the
  // reference side of a `@full-stack` scenario the as-is engine command is linked to
  // the front door of the engine's own baseline instead of to the engine stub
  // (F141-FR-016); the launch contract names the same bare command either way.
  const engineTarget =
    options.side === "reference"
      ? engineTargetOfTheReferenceSide({
          fixture: options.fixture,
          ...(options.engineRoot === undefined ? {} : { engineRoot: options.engineRoot }),
        })
      : undefined;
  buildStubBin(
    hermetic.stubBin,
    STUB_BIN_SOURCE,
    options.side,
    ...(engineTarget === undefined ? [] : ([engineTarget] as const)),
  );
  // Nothing of the machine answers a name this side does not stub. The directory goes
  // AFTER the stub directory, so the stubs still stand first (§O.3, rule 3).
  // The product's own command line on the PORT, between the stubs and the refusals.
  const product =
    options.side === "port"
      ? buildProductBin(runRoot, implementationRoot)
      : { dir: undefined, linked: [] as readonly string[] };
  const guard = denyMachineImplementations(runRoot, options.side);
  const ahead = [product.dir, guard.dir].filter((dir): dir is string => dir !== undefined);
  if (ahead.length > 0) {
    const parts = (env["PATH"] as string).split(":");
    env["PATH"] = [parts[0] as string, ...ahead, ...parts.slice(1)].join(":");
  }
  writeStubScripts(
    env["ORACLE_STUB_SCRIPT_DIR"] as string,
    (options.fixture.stubs ?? {}) as Record<string, { verbs: readonly string[] }[]>,
  );
  env["ORACLE_ENGINE_FEATURE"] = slug;

  // The two stubs that are SERVERS, each in its own process. The address the
  // critic stub bound replaces the one the caller named, in every variable
  // through which a side reaches a critic over HTTP, so the run talks to THIS
  // run's stub and to nothing else.
  const declaredStubs = (options.fixture.stubs ?? {}) as Record<string, unknown>;
  // A scenario that declares the surface `telemetry` is compared on what the shippers
  // delivered, so the sink stub has to keep what it was given. The store is of the RUN
  // and the driver is what owns the run root, so the driver names it where the caller
  // named none: a caller that forgot would otherwise compare an empty surface on both
  // sides and call it equal.
  const telemetryStore =
    options.telemetryStore ??
    (((options.fixture.surfaces ?? []) as string[]).includes("telemetry")
      ? join(runRoot, "telemetry")
      : undefined);
  const scriptDir = env["ORACLE_STUB_SCRIPT_DIR"] as string;
  const servers: ServerStub[] = [];
  if (declaredStubs["critic-http"] !== undefined) {
    const stub = startServerStub({
      kind: "critic-http",
      runRoot,
      env,
      extraEnv: {
        ORACLE_CRITIC_HTTP_SCRIPT: join(scriptDir, "critic-http.json"),
        ORACLE_CRITIC_DIAGNOSTICIAN_SCRIPT: join(scriptDir, "diagnostician.json"),
      },
    });
    servers.push(stub);
    for (const name of CRITIC_STUB_ADDRESS_VARIABLES) env[name] = stub.address;
  }
  if (declaredStubs["telemetry-sink"] !== undefined) {
    const sinkSteps = declaredStubs["telemetry-sink"] as { verbs: readonly string[] }[];
    const verb = sinkSteps[0]?.verbs[0] ?? "accept";
    const stub = startServerStub({
      kind: "telemetry-sink",
      runRoot,
      env,
      extraEnv: {
        ORACLE_SINK_VERB: verb,
        ...(telemetryStore === undefined ? {} : { ORACLE_SINK_STORE: telemetryStore }),
      },
    });
    servers.push(stub);
    env["SPECSTRIDE_LOKI_URL"] = `${stub.address}/loki/api/v1/push`;
    env["SPECSTRIDE_OTEL_URL"] = `${stub.address}/v1/traces`;
  }

  // The port runs under the named profile `parity`, selected by ordinary
  // configuration (F141-FR-004).
  let configuration: Readonly<Record<string, unknown>> | undefined;
  if (options.side === "port") {
    const port = portEnvironment(hermetic);
    configuration = portConfiguration({
      ...(options.engineStub === undefined
        ? {}
        : { engineStub: engineStubForThePort(options.engineStub) }),
      declaredKeys: port.keys,
    });
    // T141 — the second suite changes row 1 of the parity profile and nothing
    // else. The overlay is the ORACLE's change, never the fixture's, so it is
    // applied after the fixture's keys are checked and is itself checked: only
    // keys the `parity` profile names may be overlaid (F141-FR-004, F141-FR-039).
    if (options.configurationOverlay !== undefined) {
      const allowed = new Set(parityProfileKeys());
      for (const [key, value] of Object.entries(options.configurationOverlay)) {
        if (!allowed.has(key)) {
          throw new DriverError(
            `the configuration overlay would set ${key}, which is no key of the parity profile ` +
              `(F141-FR-004)`,
          );
        }
        configuration = { ...configuration, [key]: value };
      }
    }
    const file = join(env["XDG_CONFIG_HOME"] as string, PORT_CONFIGURATION_FILE);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(configuration, null, 1)}\n`, "utf8");
  }

  // Everything the layout planted is backdated together, so the reference's own
  // freshness tests read the fixture's intent and not the speed of the layout
  // (`backdateLayout`). This is the LAST thing before the first command.
  backdateLayout([workdir, ...Object.values(statePaths)]);

  // The steps of commands, in order, with the owner decisions of F141-FR-043
  // applied — the reset flag of the FX-13 resume scenarios on the port, and
  // nothing on the reference side (T145).
  const steps = applyOwnerDecisions(stepsOf(options), {
    side: options.side,
    fixtureId:
      typeof (options.fixture as Record<string, unknown>)["id"] === "string"
        ? ((options.fixture as Record<string, unknown>)["id"] as string)
        : undefined,
  });
  const system = String(options.fixture.system ?? "specstride");
  const places: Record<string, string> = {
    "<WORK>": workdir,
    "<FIXTURE>": fixtureDir,
    "<IMPL>": implementationRoot,
    "<HOME>": env["HOME"] as string,
    "<TMP>": env["TMPDIR"] as string,
  };
  const commands: CommandRecord[] = [];
  const onATerminal = options.fixture["pseudoTerminal"] === true;
  const terminal = terminalSizeOf(options.fixture);
  // What is in the process group before the run starts: not left behind by it.
  const beforeTheRun = pidsOfTheGroup(process.pid);
  for (const step of steps) {
    // T157: a scenario of FX-40 that names the presenter, the banner or the
    // theme tool as its entry point and writes no command of its own gets the
    // argv built from the entry point (src/run/entry-points.ts).
    const declaredArgv = resolveStepArgv(
      options.fixture as Record<string, unknown>,
      options.side,
      implementationRoot,
      step.argv.length > 0 ? step.argv : undefined,
      step as Record<string, unknown>,
    );
    const argv = resolveArgv(declaredArgv ?? [], places).map((a) =>
      resolveComponentPlaceholders(a, system),
    );
    if (onATerminal) {
      // FX-40: the command runs on a pseudo-terminal of fixed size, standard
      // output and standard error each on a device of their own (T132). The
      // answer to the background query is data of the fixture (T157): the
      // theme tool asks the device with OSC 11 and reads the reply.
      const backgroundAnswer = backgroundQueryAnswer(options.fixture as Record<string, unknown>);
      const onTerminal = runOnPseudoTerminal({
        argv,
        cwd: workdir,
        env,
        columns: terminal.columns,
        rows: terminal.rows,
        ...(backgroundAnswer === undefined ? {} : { input: backgroundAnswer }),
        ...(step.boundedSeconds === undefined ? {} : { boundedSeconds: step.boundedSeconds }),
      });
      commands.push({
        argv,
        exitCode: onTerminal.exitCode,
        ...(onTerminal.signal === undefined ? {} : { signal: onTerminal.signal }),
        stdout: onTerminal.stdout,
        stderr: onTerminal.stderr,
      });
      continue;
    }
    const result = spawnSync(argv[0] as string, argv.slice(1), {
      cwd: workdir,
      env,
      // The empty environment and nothing of the parent's: `env` is the whole
      // environment of the child (F141-FR-003).
      maxBuffer: 256 * 1024 * 1024,
      ...(step.boundedSeconds === undefined
        ? {}
        : { timeout: Math.trunc(step.boundedSeconds * 1000), killSignal: "SIGTERM" as const }),
    });
    commands.push({
      argv,
      exitCode: result.status ?? (result.signal === null ? 1 : 128),
      ...(result.signal === null || result.signal === undefined ? {} : { signal: result.signal }),
      stdout: new Uint8Array(result.stdout ?? Buffer.alloc(0)),
      stderr: new Uint8Array(result.stderr ?? Buffer.alloc(0)),
    });
  }

  // Every server stub of this run is stopped before the capture is taken, so a
  // surface of the capture never holds a process of the oracle's own making.
  for (const server of servers) server.stop();

  // The processes the run left behind, listed BEFORE the capture (F141-FR-019).
  const processesLeftBehind = listProcessesLeftBehind(process.pid, beforeTheRun);

  const context: CaptureContext = {
    scenario: options.scenario,
    side: options.side,
    suite: options.suite ?? "first",
    commands,
    workdir,
    home: env["HOME"] as string,
    temporaryDirectory: env["TMPDIR"] as string,
    statePaths,
    eventFiles: eventFilesOf(workdir),
    transcriptFile: env["ORACLE_STUB_TRANSCRIPT"] as string,
    processesLeftBehind,
    ...(telemetryStore === undefined ? {} : { telemetryStore }),
    launcherRoot: workdir,
    repositoryRoot: workdir,
    runHasEnded: true,
  };
  const surfaces = (options.fixture.surfaces ?? []) as string[];
  // F141-FR-019 — on the port the capture also holds S-14 to S-16, whether the
  // fixture names them or not: the second suite asserts from them, and a
  // capture A without them would let every assertion of that suite pass on
  // nothing (T141). The primary event file and the ledger record the driver
  // names are the ones the layout tables of feature 100 resolve for this run.
  let portOnlyNames: readonly string[] = [];
  let primaryEventFile: string | undefined;
  let countersFile: string | undefined;
  let controlPaths: Readonly<Record<string, string>> = {};
  if (options.side === "port") {
    portOnlyNames = ["events-primary", "control-records", "counters"];
    const resolved = resolveStatePaths(["run:<runId>:events", "run:<runId>:ledger"], "port", {
      workdir,
      slug,
      roots: stateRoots,
      parameters: { ...TEMPLATE_STATE_PARAMETERS, slug, runId: "run" },
    });
    primaryEventFile = resolved["run:<runId>:events"];
    countersFile = resolved["run:<runId>:ledger"];
    controlPaths = { ...statePaths, ...resolved };
  }
  const capture = captureSurfaces(context, [...surfaces, ...portOnlyNames], {
    ...(steps[steps.length - 1]?.resumeCause === undefined
      ? {}
      : { resumeCause: steps[steps.length - 1]?.resumeCause as string }),
    ...(pipelineOf(options.fixture, places) === undefined
      ? {}
      : { pipeline: pipelineOf(options.fixture, places) }),
    ...(primaryEventFile === undefined ? {} : { primaryEventFile }),
    ...(countersFile === undefined ? {} : { countersFile }),
    ...(Object.keys(controlPaths).length === 0 ? {} : { controlPaths }),
    ...(options.side === "port" && options.configurationOverlay !== undefined
      ? { layer: "on" as const }
      : {}),
  });

  return Object.freeze({
    capture:
      options.seedDifference === undefined
        ? capture
        : seedADifference(capture, options.seedDifference),
    commands: Object.freeze(commands),
    workdir,
    runRoot,
    env: Object.freeze(env),
    statePaths,
    fixtureDir,
    ...(configuration === undefined ? {} : { configuration }),
    processesLeftBehind,
  });
}

/**
 * Where the surface `pipeline` reads, as the SCENARIO names it.
 *
 * S-09 is "the state record, the launch record of the supervisor and the three
 * logs", and §O.4 names no file: the as-is names differ per baseline, and those of
 * the mixture-of-loops baseline at `9c88f86` are `state.json` and
 * `harness-run.json` under the runs directory of its artifact root, with the three logs
 * `launcher.log` (the runtime's own reporter), `harness-launch.log` and
 * `harness-report.log` (the supervisor's). A scenario of FX-35 or FX-36 declares
 * them, which is what `capturePipeline` was written to be given; a scenario that
 * declares nothing keeps the defaults of that module.
 */
export function pipelineOf(
  fixture: Readonly<Record<string, unknown>>,
  places: Readonly<Record<string, string>>,
):
  | {
      readonly root?: string;
      readonly records?: readonly string[];
      readonly logs?: readonly string[];
    }
  | undefined {
  const declared = fixture["pipeline"];
  if (declared === undefined) return undefined;
  if (typeof declared !== "object" || declared === null || Array.isArray(declared)) {
    throw new DriverError("`pipeline` of a scenario is an object of `root`, `records` and `logs`");
  }
  const value = declared as Record<string, unknown>;
  const names = (key: string): readonly string[] | undefined => {
    const list = value[key];
    if (list === undefined) return undefined;
    if (!Array.isArray(list) || list.some((n) => typeof n !== "string" || n.includes("/"))) {
      throw new DriverError(
        `\`pipeline.${key}\` of a scenario is a list of file names inside \`pipeline.root\``,
      );
    }
    return Object.freeze([...(list as string[])]);
  };
  const root = value["root"];
  if (root !== undefined && typeof root !== "string") {
    throw new DriverError(
      "`pipeline.root` of a scenario is a path with the places of the run in it",
    );
  }
  return Object.freeze({
    ...(root === undefined ? {} : { root: resolveArgv([root], places)[0] as string }),
    ...(names("records") === undefined ? {} : { records: names("records") as readonly string[] }),
    ...(names("logs") === undefined ? {} : { logs: names("logs") as readonly string[] }),
  });
}

/**
 * The logical names of state that the scripts of the stubs of a scenario write
 * (the argument `state` of the proposer verb `write`). They are files of state of
 * the run exactly as the template's are, so they belong to the map the surface
 * `state` is keyed by, whether or not the template plants them.
 */
export function stateNamesOfStubScripts(stubs: unknown): readonly string[] {
  const names: string[] = [];
  for (const steps of Object.values((stubs ?? {}) as Record<string, unknown>)) {
    if (!Array.isArray(steps)) continue;
    for (const step of steps as Record<string, unknown>[]) {
      const args = step["args"] as Record<string, unknown> | undefined;
      const named = args?.["state"];
      if (typeof named === "string" && named !== "") names.push(named);
    }
  }
  return Object.freeze([...new Set(names)]);
}

/**
 * The size of the terminal a scenario of FX-40 runs on. The scenarios of the first
 * set run at the fixed default of `src/run/pty.ts`; the size as DATA of the fixture
 * (`pseudoTerminalSize`) is what T157 adds, together with the answer to the
 * background query and the presenter, the banner and the theme tool as entry
 * points, so this reads the field and does not require it. A fixture cannot say the
 * size in `COLUMNS`: that is no row of the environment alias table of feature 100,
 * and a variable outside the table is refused (F141-FR-003).
 */
export function terminalSizeOf(fixture: Readonly<Record<string, unknown>>): {
  readonly columns: number;
  readonly rows: number;
} {
  const declared = (fixture["pseudoTerminalSize"] ?? {}) as Record<string, unknown>;
  const number = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return value === undefined || !Number.isFinite(parsed) || parsed <= 0
      ? fallback
      : Math.trunc(parsed);
  };
  return Object.freeze({
    columns: number(declared["columns"], TERMINAL_COLUMNS),
    rows: number(declared["rows"], TERMINAL_ROWS),
  });
}

/** The steps of commands of a scenario: `steps` where it has them, else `command`. */
export function stepsOf(options: DriveOptions): readonly Step[] {
  const fixture = options.fixture as Record<string, unknown>;
  const steps = fixture["steps"];
  if (Array.isArray(steps) && steps.length > 0) {
    return Object.freeze(
      (steps as Record<string, unknown>[]).map((step) => {
        const command = step["command"] as Record<string, string[]> | undefined;
        const argv = command?.[options.side] ?? [];
        return Object.freeze({
          argv: Object.freeze([...argv]),
          // T157: a step of an FX-40 scenario may name the entry point IT
          // drives (the banner in one step, the presenter in the next).
          entryPoint: step["entryPoint"] as string | undefined,
          entryPointArguments: step["entryPointArguments"] as Record<string, string[]> | undefined,
          ...(step["resumeCause"] === undefined
            ? {}
            : { resumeCause: String(step["resumeCause"]) }),
          ...(step["boundedSeconds"] === undefined
            ? {}
            : { boundedSeconds: Number(step["boundedSeconds"]) }),
        });
      }),
    );
  }
  const command = fixture["command"] as Record<string, string[]> | undefined;
  const bounded = fixture["boundedSeconds"];
  return Object.freeze([
    {
      argv: Object.freeze([...(command?.[options.side] ?? [])]),
      ...(bounded === undefined ? {} : { boundedSeconds: Number(bounded) }),
    },
  ]);
}

/** Every event file inside the working directory of a run. */
export function eventFilesOf(workdir: string): readonly string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    let names: string[];
    try {
      names = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const name of names) {
      if (name === ".git" || name === "node_modules") continue;
      const path = join(dir, name);
      const stat = lstatSync(path);
      if (stat.isDirectory()) walk(path);
      else if (stat.isFile() && /events?\.jsonl$/.test(basename(path))) found.push(path);
    }
  };
  walk(workdir);
  return Object.freeze(found);
}

/**
 * Seed a difference in ONE surface of a capture, for the self-proof: the
 * reference compared with itself gives `equal`, and a seeded difference in any one
 * surface gives `different` on that surface and on no other (F141-FR-044,
 * F141-SC-004). The seed is applied to the CAPTURE and never to a run, so a run
 * of the reference is never altered to make a test pass.
 */
export function seedADifference(capture: Capture, surface: string): Capture {
  if (!(surface in capture.surfaces)) {
    throw new DriverError(
      `the capture of ${capture.scenario} (${capture.side}) holds no surface ${surface}, so a ` +
        `difference cannot be seeded in it (it holds ${Object.keys(capture.surfaces).join(", ")})`,
    );
  }
  const seeded = { ...capture.surfaces } as Record<string, unknown>;
  const value = seeded[surface];
  seeded[surface] = {
    ...(value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : { value }),
    seededDifference: "one byte the other side does not have",
  };
  return Object.freeze({ ...capture, surfaces: Object.freeze(seeded) });
}

/**
 * Every file of the reference tree that the command of a scenario names, as a
 * path relative to the tree: each `<IMPL>/…` argument of every step, with the
 * placeholder taken off. It is what `sideIsAvailable` checks for the reference,
 * so a scenario whose entry point is a LOGICAL component name is still held to
 * the files it actually runs.
 */
export function implementationFilesOf(
  steps: readonly Step[],
  system = "specstride",
): readonly string[] {
  const found = new Set<string>();
  for (const step of steps) {
    for (const argument of step.argv) {
      // A `<component:…>` placeholder is resolved first: what the scenario names is
      // the logical component, and the file it is in the tree is what must exist.
      for (const match of resolveComponentPlaceholders(argument, system).matchAll(
        /<IMPL>\/([^\s'"]+)/g,
      )) {
        found.add(match[1] as string);
      }
    }
  }
  return Object.freeze([...found]);
}

/**
 * Whether a side can be run at all, and why not where it cannot.
 *
 * On the reference the subject is the TREE and the files the command of the
 * scenario names inside it. The field `entryPoint.reference` of a declaration is
 * a LOGICAL component name of feature 100 (`contract-derive`) or a described
 * as-is entry point (`front-door`), not a path — so a path is only looked for
 * where the entry point is written as one, and what is otherwise checked is
 * every `<IMPL>`-rooted file of the command (`commandFiles`).
 */
export function sideIsAvailable(
  side: "reference" | "port",
  root: string,
  entryPoint: string,
  commandFiles: readonly string[] = [],
): SideUnavailable | undefined {
  if (side === "reference") {
    if (!existsSync(root)) {
      return { side, reason: `the reference tree ${root} is not in scratch; run the fetch first` };
    }
    // An entry point written as a path (`specstride`, `lib/reverse.py`) is a file
    // of the tree; a logical component name is not. One of the three entry points
    // of FX-40 (T157) is a name the driver resolves into a file of the tree, so
    // the file is checked under its name.
    if (isFx40EntryPoint(entryPoint)) {
      const file = entryPointFile(entryPoint);
      if (!existsSync(join(root, file))) {
        return { side, reason: `${file} is not in the reference tree ${root}` };
      }
    } else if (entryPoint.includes("/") || /\.(py|sh)$/.test(entryPoint)) {
      if (!existsSync(join(root, entryPoint))) {
        return { side, reason: `${entryPoint} is not in the reference tree ${root}` };
      }
    }
    for (const file of commandFiles) {
      if (!existsSync(join(root, file))) {
        return {
          side,
          reason: `the command of the scenario names ${file}, which is not in the reference tree ${root}`,
        };
      }
    }
    return undefined;
  }
  // The port: the COMMAND the scenario names must be one the product's command line
  // has. The subject is the command and not the package: `@specstride/cli` carries
  // the commands of CLI protocol 1 one owner at a time, so a build may be able to
  // drive one scenario and not the next. A command the build does not have is NOT a
  // failure of the oracle; it is a skip with its reason, and at the release check a
  // skip blocks (F141-FR-026).
  const line = productCommandLine(root);
  if (line === undefined) {
    return { side, reason: `the product's command line is not in ${root}` };
  }
  const executable = Object.entries(line.executables).find(([, file]) =>
    existsSync(join(resolve(root), PRODUCT_COMMAND_PACKAGE, file)),
  );
  if (executable === undefined) {
    return {
      side,
      reason:
        `${join(PRODUCT_COMMAND_PACKAGE, "package.json")} names no executable of the product's ` +
        `command line, so the port has nothing to drive. This is a DECLARED missing prerequisite ` +
        `of the scenario, reported as a skip with its reason and never as a pass (F141-FR-037); ` +
        `at the release check a skip blocks (F141-FR-026)`,
    };
  }
  if (entryPoint !== "" && !line.commands.includes(entryPoint)) {
    return {
      side,
      reason:
        `the product's command line does not have the command \`${entryPoint}\` in this build; ` +
        `the commands it declares are ${line.commands.length === 0 ? "none" : line.commands.map((c) => `\`${c}\``).join(", ")}. ` +
        `The rest of CLI protocol 1 belongs to the features that own each command. This is a ` +
        `DECLARED missing prerequisite of the scenario, reported as a skip with its reason and ` +
        `never as a pass (F141-FR-037); at the release check a skip blocks (F141-FR-026)`,
    };
  }
  return undefined;
}

/**
 * A side that a DECLARED missing prerequisite says cannot be driven at all.
 *
 * It is not a failure of the oracle and it is not a difference of the product: it
 * is the absence of a side. F141-FR-037 — "a fixture whose prerequisite is missing
 * MUST be reported as a skip with its reason and never as a pass" — and a skip is
 * equally never a FAIL, which is what makes this an error of the driver rather
 * than a capture: a comparison of a side that is not there has no meaning, in
 * either direction.
 */
export class SideUnavailableError extends DriverError {
  readonly unavailable: SideUnavailable;
  constructor(scenario: string, unavailable: SideUnavailable) {
    super(
      `${scenario}: the ${unavailable.side} side cannot be driven, so the oracle refuses to ` +
        `capture it. ${unavailable.reason}`,
    );
    this.name = "SideUnavailableError";
    this.unavailable = unavailable;
  }
}

/**
 * The oracle NEVER captures a side whose prerequisite is declared missing
 * (F141-FR-037).
 *
 * Without this the driver would happily "run" a side that has no command: the
 * search-path guard of `denyMachineImplementations` answers the missing name with
 * `NO_SUCH_COMMAND`, the capture of that run is a real capture of a refusal, and
 * the comparator then reads `different` on `exit`, `stderr` and `tree` — a parity
 * FAILURE reported against a product that does not exist yet. That is the oracle
 * fabricating a comparison out of its own hermetic guard, which is the one thing a
 * differential oracle may not do. The prerequisite is a skip with its reason, so
 * the driver refuses the run and the caller reports the reason.
 *
 * `sideIsAvailable` is the single reading of availability — the same one the tier
 * runner and the parity tests use for their skip — so a side can never be judged
 * available by a runner and driven anyway, or the other way about.
 */
export function refuseToDriveAnUnavailableSide(options: DriveOptions): void {
  const entryPoints = (options.fixture as Record<string, unknown>)["entryPoint"] as
    Record<string, string> | undefined;
  const entryPoint = entryPoints?.[options.side] ?? "";
  const system = String((options.fixture as Record<string, unknown>)["system"] ?? "specstride");
  const unavailable = sideIsAvailable(
    options.side,
    resolve(options.implementationRoot),
    entryPoint,
    implementationFilesOf(stepsOf(options), system),
  );
  if (unavailable !== undefined) throw new SideUnavailableError(options.scenario, unavailable);
}
