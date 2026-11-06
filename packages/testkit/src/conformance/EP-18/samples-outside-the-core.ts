/**
 * T030 of feature 149 — the last row of the conformance suite of
 * `specs/149-attempt-planner-and-seams/contracts/ep18-seams.md`:
 *
 *   | Samples outside the core | No core file names a sample; the build with
 *   | and without the samples differs in no core file |
 *
 * Three observations, each made on the workspace as it is or on a SCRATCH COPY
 * of it. Nothing here writes the workspace: the samples of
 * `packages/testkit/src/samples/` are never removed from the working tree, only
 * from a copy under the temporary directory of the platform, which is removed
 * again. (PROGRESS.md of this feature, phase 1: removing the samples in place
 * makes every concurrent repository-wide check fail.)
 *
 *  1. `coreFilesNamingASample()` of the frame is empty: no file of a package the
 *     package graph marks `core: true` names a sample, by path or by directory;
 *  2. every core package of the graph builds to the same bytes with the samples
 *     present and with `packages/testkit/src/samples/` gone;
 *  3. a core file that DOES name a sample makes the import-boundary check fail,
 *     with the file, the name and the rule `core:names-sample`.
 *
 * The "build" of a core package is the declaration emit of the TypeScript
 * compiler over its project, hashed together with the hash of its source tree.
 * That is the same subject feature 100's T280 takes for CT-100-322; this file
 * takes it again for the samples of EP-18 and reports per package, so that the
 * failure names the core package that differed.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { ROOT } from "../frame.ts";
import { SAMPLES_DIR, coreFilesNamingASample, corePackages } from "../register-samples.ts";

/** The check the root script `check:imports` runs. */
export const IMPORT_BOUNDARY = "tools/import-boundary/src/index.ts" as const;

/** The package graph, which marks the core packages. */
export const GRAPH = "packages/contracts/data/package-graph.json" as const;

/** The rule of the import-boundary check that a naming of a sample breaks. */
export const NAMING_RULE = "core:names-sample" as const;

/** The directory of a package of the graph, relative to the root. */
export function directoryOf(name: string): string {
  return join("packages", name.replace(/^@specstride\//, ""));
}

function everyFile(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) everyFile(path, out);
    else if (entry.isFile()) out.push(path);
  }
  return out;
}

/** The hash of a tree: every file, by path, with the hash of its bytes. */
export function hashOfTree(dir: string): string {
  const hash = createHash("sha256");
  for (const file of everyFile(dir).sort()) {
    hash.update(file.slice(dir.length + 1));
    hash.update("\u0000");
    hash.update(createHash("sha256").update(readFileSync(file)).digest("hex"));
    hash.update("\n");
  }
  return hash.digest("hex");
}

/**
 * A scratch copy of the workspace: the packages, the tools, the two
 * configuration files, and a `node_modules` that resolves every external
 * package from the workspace and every package of the graph from the copy.
 */
export function scratchCopy(): string {
  const scratch = mkdtempSync(join(tmpdir(), "specstride-ep18-"));
  for (const entry of ["packages", "tools", "tsconfig.base.json", "package.json"]) {
    cpSync(join(ROOT, entry), join(scratch, entry), { recursive: true, dereference: true });
  }
  const modules = join(scratch, "node_modules");
  mkdirSync(modules, { recursive: true });
  for (const entry of readdirSync(join(ROOT, "node_modules"))) {
    if (entry === "@specstride") continue;
    symlinkSync(join(ROOT, "node_modules", entry), join(modules, entry));
  }
  mkdirSync(join(modules, "@specstride"), { recursive: true });
  for (const group of ["packages", "tools"]) {
    for (const name of readdirSync(join(scratch, group))) {
      const dir = join(scratch, group, name);
      if (!existsSync(join(dir, "package.json"))) continue;
      const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
        name?: string;
      };
      if (manifest.name === undefined || !manifest.name.startsWith("@specstride/")) continue;
      const link = join(modules, manifest.name);
      if (!existsSync(link)) symlinkSync(dir, link);
    }
  }
  return scratch;
}

/**
 * The core packages of the graph whose build this file compares: every package
 * the graph marks `core: true` that exists in the copy with a project file of
 * the TypeScript compiler.
 */
export function coreProjectsOf(root: string): readonly string[] {
  return Object.freeze(
    corePackages()
      .filter((name) => existsSync(join(root, directoryOf(name), "tsconfig.json")))
      .sort(),
  );
}

/**
 * Build one core package of a copy: the declaration emit of its project,
 * hashed with the hash of its source tree. The hash is the "build" the row of
 * the contract table compares.
 */
export function buildCorePackage(root: string, name: string): string {
  const dir = join(root, directoryOf(name));
  const out = join(root, ".build-out", name.replace(/[^a-z0-9]+/gi, "-"));
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  execFileSync(
    process.execPath,
    [
      join(ROOT, "node_modules/typescript/bin/tsc"),
      "-p",
      dir,
      "--noEmit",
      "false",
      "--emitDeclarationOnly",
      "--declaration",
      "--outDir",
      out,
    ],
    { cwd: root, encoding: "utf8" },
  );
  const hash = createHash("sha256");
  hash.update(hashOfTree(out));
  hash.update(hashOfTree(join(dir, "src")));
  return hash.digest("hex");
}

/** The build of every core package of a copy, as one hash per package. */
export function buildEveryCorePackage(root: string): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const name of coreProjectsOf(root)) out[name] = buildCorePackage(root, name);
  return Object.freeze(out);
}

/** What the comparison of the two builds observed. */
export type CoreBuildComparison = {
  /** Every package the graph marks `core: true`. */
  readonly corePackages: readonly string[];
  /** Those of them this comparison built. */
  readonly built: readonly string[];
  /** How many samples `packages/testkit/src/samples/` held in the copy. */
  readonly samplesInTheCopy: number;
  readonly withSamples: Readonly<Record<string, string>>;
  readonly withoutSamples: Readonly<Record<string, string>>;
  /** The core packages whose build differed. Empty is the pass. */
  readonly differing: readonly string[];
};

/**
 * F149-FR-010 — build every core package of a scratch copy twice, once with
 * `packages/testkit/src/samples/` present and once with it removed, and name
 * every core package whose build differed. An empty `differing` is the pass:
 * adding or removing a sample changes no core file.
 */
export function compareTheBuildWithAndWithoutTheSamples(): CoreBuildComparison {
  const scratch = scratchCopy();
  try {
    const samples = join(scratch, SAMPLES_DIR);
    const samplesInTheCopy = existsSync(samples)
      ? readdirSync(samples).filter((name) => /^EP-\d{2}$/.test(name)).length
      : 0;
    const withSamples = buildEveryCorePackage(scratch);
    rmSync(samples, { recursive: true, force: true });
    const withoutSamples = buildEveryCorePackage(scratch);
    const built = coreProjectsOf(scratch);
    return Object.freeze({
      corePackages: corePackages(),
      built,
      samplesInTheCopy,
      withSamples,
      withoutSamples,
      differing: Object.freeze(built.filter((name) => withSamples[name] !== withoutSamples[name])),
    });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/** The outcome of one run of the import-boundary check over a copy. */
export type BoundaryRun = { readonly code: number; readonly output: string };

/** Run the import-boundary check over a root and return its code and output. */
export function runImportBoundary(root: string): BoundaryRun {
  try {
    const output = execFileSync(process.execPath, [join(ROOT, IMPORT_BOUNDARY), "--root", root], {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    });
    return { code: 0, output };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

/** What the naming check observed on the scratch copy. */
export type NamingObservation = {
  /** The code of the check on the untouched copy. 0 is the pass. */
  readonly cleanCode: number;
  /** The core file the observation wrote, relative to the root. */
  readonly offendingFile: string;
  /** The sample the core file named. */
  readonly sampleNamed: string;
  /** The code of the check with the naming in place. 1 is the pass. */
  readonly namedCode: number;
  /** The output of the check with the naming in place. */
  readonly namedOutput: string;
  /** The code of the check after the naming was taken out again. */
  readonly restoredCode: number;
};

/**
 * F149-FR-010 — the build FAILS when a core file names a sample. The naming is
 * written into a core package of a SCRATCH COPY, never into the workspace; the
 * same check is run before, with and after it, so that the failure is the
 * naming and nothing else.
 */
export function observeACoreFileNamingASample(
  sample = `${SAMPLES_DIR}/EP-18/sample-critic-strategy.ts`,
): NamingObservation {
  const scratch = scratchCopy();
  try {
    const clean = runImportBoundary(scratch);
    const core = corePackages()[0] ?? "@specstride/core";
    const relative = `${directoryOf(core)}/src/ep18/names-a-sample.ts`;
    const file = join(scratch, relative);
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, `export const theSample = ${JSON.stringify(sample)};\n`);
    const named = runImportBoundary(scratch);
    rmSync(file, { force: true });
    const restored = runImportBoundary(scratch);
    return Object.freeze({
      cleanCode: clean.code,
      offendingFile: relative,
      sampleNamed: sample,
      namedCode: named.code,
      namedOutput: named.output,
      restoredCode: restored.code,
    });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

export { SAMPLES_DIR, coreFilesNamingASample, corePackages };
