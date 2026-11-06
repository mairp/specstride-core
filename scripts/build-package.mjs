/**
 * The staging writer of the packages that cross a repository boundary
 * (the split of the monorepo, phase 3): it emits built JavaScript and
 * declarations for a package whose `exports` point at `.ts` source, and
 * stages a publish-ready tree under `packages/<name>/.build/pack/`.
 *
 * Node does not strip types under `node_modules`, so every package another
 * repository installs must ship built JS plus `.d.ts`, not `.ts` source.
 * The emit is `tsc -p tsconfig.build.json` per package: the build config
 * mirrors `src/` into `.build/dist/` one-to-one, so a module that reads a
 * data file by a relative path keeps its depth (`dist/x.js` still reaches
 * `../../data/...`), and `rewriteRelativeImportExtensions` turns the
 * `.ts` specifiers of the source into `.js` in the emitted JS. The staged
 * tree is therefore `dist/` plus the data and schema assets the emitted JS
 * reads at run time, with `data/` and `schemas/` as siblings of `dist/`.
 * The build configs set `noEmitOnError`: a build that fails on anything
 * must leave NO file, in the staging or beside the source files of another
 * package, so a failed run can never leave a tree that looks built.
 *
 * The staged manifest (NOT the workspace manifest, whose exact `0.0.0`
 * pins are load-bearing for the workspace install) carries the ONE release
 * version — the `version` of the root manifest (docs/PUBLISHING.md) — no
 * script at all (so no install script), `publishConfig.access: "public"`,
 * and exact-version dependencies only: a `@specstride/` sibling is pinned
 * to the release version, a third-party dependency keeps the exact pin it
 * already has in the workspace.
 *
 * The staging is a build artifact: regenerated from scratch on every run,
 * and nothing in the source tree is touched. `.build/` is git-ignored.
 *
 * A package whose published surface is a SUBSET of its sources writes a
 * `staging.json` beside its manifest (the split, phase 3; `testkit` is the
 * first): `exportsSubset` keeps the listed `exports` rows and refuses an
 * unknown key, `modules` stages exactly those builds (`<module>.js` with
 * its sibling `.d.ts`) instead of the whole `dist/`, `fixtureFiles` copies
 * repository files into the staging at their repository-relative spelling
 * (the corpus fixtures the staged JS reads at run time), `assetDirectories`
 * overrides which data directories ship, and `computedDependencies: true`
 * derives the staged `dependencies` from the `@specstride/` imports the
 * staged JS actually holds (each pinned at the release version and checked
 * against the workspaces) instead of from the source manifest, whose
 * dependencies a test-only package keeps as devDependencies.
 *
 * Usage: `node scripts/build-package.mjs <name> [name ...]` with a name that
 * is a workspace directory under `packages/` (for example `contracts`).
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagesRoot = join(repositoryRoot, "packages");

const ROOT_MANIFEST = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8"));
/** The ONE release version of the four published packages (the split, phase 3). */
const RELEASE_VERSION = ROOT_MANIFEST.version;
const TSC = join(repositoryRoot, "node_modules", "typescript", "bin", "tsc");

/**
 * The assets a package ships beside `dist/`: directories copied whole when
 * they exist (the emitted JS reads them at run time by their depth), plus
 * `README.md` and the repository licence, which `npm pack` includes from the
 * package root of the staging tree. `DEPENDENCIES.md` ships when the package
 * keeps one.
 */
const ASSET_DIRECTORIES = ["data", "schemas"];
const ASSET_FILES = ["README.md", "DEPENDENCIES.md"];

/** The root licence, staged into every published package (Apache-2.0). */
const LICENSE_FILE = join(repositoryRoot, "LICENSE");

/** The staging profile of a package whose published surface is a subset. */
function profileOf(packageDirectory, name) {
  const path = join(packageDirectory, "staging.json");
  if (!existsSync(path)) return undefined;
  const profile = JSON.parse(readFileSync(path, "utf8"));
  for (const key of [
    "exportsSubset",
    "modules",
    "fixtureFiles",
    "assetDirectories",
    "computedDependencies",
  ]) {
    if (profile[key] === undefined) {
      throw new Error(`${name}: staging.json holds no "${key}"`);
    }
  }
  return profile;
}

/** The staged `exports`: a `./src/*.ts` module becomes its `./dist/*.js` build. */
function stagedExports(sourceExports, profile, name) {
  const staged = {};
  for (const key of profile?.exportsSubset ?? Object.keys(sourceExports)) {
    if (!(key in sourceExports)) {
      throw new Error(`${name}: staging.json keeps "${key}", which the manifest does not declare`);
    }
    const value = sourceExports[key];
    if (value.startsWith("./src/") && value.endsWith(".ts")) {
      staged[key] = `./dist/${value.slice("./src/".length, -".ts".length)}.js`;
    } else {
      // Pattern rows (`./schemas/*`, `./data/*`) keep their asset spelling.
      staged[key] = value;
    }
  }
  return staged;
}

/** The staged dependencies: a sibling of the release is pinned at the release version. */
function stagedDependencies(sourceDependencies) {
  const staged = {};
  for (const [name, range] of Object.entries(sourceDependencies ?? {})) {
    staged[name] = name.startsWith("@specstride/") ? RELEASE_VERSION : range;
  }
  return staged;
}

/** The sibling imports the staged JS holds, each pinned at the release version. */
function computedDependencies(staging, name) {
  const siblingImport = /(?:from\s+|import\s*\(\s*)["'](@specstride\/[a-z0-9-]+)(?:\/[^"']*)?["']/g;
  const names = new Set();
  for (const file of listStaged(join(staging, "dist"))) {
    if (!file.endsWith(".js")) continue;
    const text = readFileSync(join(staging, "dist", file), "utf8");
    for (const match of text.matchAll(siblingImport)) names.add(match[1]);
  }
  for (const sibling of names) {
    if (!existsSync(join(packagesRoot, sibling.slice("@specstride/".length)))) {
      throw new Error(`${name}: the staged JS imports ${sibling}, which is no workspace package`);
    }
  }
  return Object.fromEntries([...names].sort().map((sibling) => [sibling, RELEASE_VERSION]));
}

/** The files of a staged tree, relative to it, in a stable order. */
function listStaged(staging) {
  return readdirSync(staging, { recursive: true })
    .map(String)
    .filter((entry) => !entry.endsWith("/"))
    .sort();
}

function copyAssets(packageDirectory, staging, profile, name) {
  for (const directory of profile?.assetDirectories ?? ASSET_DIRECTORIES) {
    const from = join(packageDirectory, directory);
    if (!existsSync(from)) {
      // An explicit profile row is a claim about the package; the default
      // list is only the candidates, so a package without the directory
      // simply ships none of it.
      if (profile?.assetDirectories !== undefined) {
        throw new Error(`${name}: the profile names ${directory}, which the package does not hold`);
      }
      continue;
    }
    cpSync(from, join(staging, directory), { recursive: true });
  }
  for (const file of ASSET_FILES) {
    const from = join(packageDirectory, file);
    if (existsSync(from)) copyFileSync(from, join(staging, file));
  }
  if (existsSync(LICENSE_FILE)) copyFileSync(LICENSE_FILE, join(staging, "LICENSE"));
}

/** The corpus fixtures a subset surface reads at run time, at their repository spelling. */
function copyFixtures(staging, profile, name) {
  for (const file of profile?.fixtureFiles ?? []) {
    const from = join(repositoryRoot, file);
    if (!existsSync(from)) {
      throw new Error(`${name}: staging.json names ${file}, which the repository does not hold`);
    }
    const to = join(staging, file);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
}

/** The staged build: the whole `dist/`, or the modules the profile lists. */
function stageDist(build, staging, profile, name) {
  const dist = join(build, "dist");
  if (profile?.modules === undefined) {
    cpSync(dist, join(staging, "dist"), { recursive: true });
    return;
  }
  for (const module of profile.modules) {
    for (const extension of [".js", ".d.ts"]) {
      const from = join(dist, `${module}${extension}`);
      if (!existsSync(from)) {
        throw new Error(
          `${name}: the build emitted no ${module}${extension} for the staging profile`,
        );
      }
      const to = join(staging, "dist", `${module}${extension}`);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
    }
  }
}

/** Fails the run when the staged tree cannot serve an `exports` row it declares. */
function checkStagedTree(staging, staged, name) {
  for (const [key, value] of Object.entries(staged.exports)) {
    if (!value.startsWith("./dist/")) continue;
    const target = value.endsWith(".js") ? value : undefined;
    if (target !== undefined && !existsSync(join(staging, target))) {
      throw new Error(`exports row "${key}" points at ${value}, which the build did not emit`);
    }
  }
  const emitted = listStaged(join(staging, "dist"));
  // A declaration file is the shipped surface; a `.ts`/`.mts`/`.cts` SOURCE
  // file under `node_modules` would not be stripped, so it must never ship.
  const sourceFiles = emitted.filter(
    (entry) => /\.(ts|mts|cts)$/.test(entry) && !/\.d\.(ts|mts|cts)$/.test(entry),
  );
  if (sourceFiles.length > 0) {
    throw new Error(`the staged dist/ carries .ts source: ${sourceFiles.slice(0, 5).join(", ")}`);
  }
  // Every staged JS module reaches every module it names by a static import:
  // a subset staging that forgot a file fails here, at the build. The one
  // blind spot is a dynamic import of a path the program cannot see (the
  // script of `run.js` names the corpus files of every point by a template
  // literal), which the staged surface never calls.
  const staticImport = /(?:from\s+)["'](\.\.?\/[^"']+)["']/g;
  for (const file of emitted) {
    if (!file.endsWith(".js")) continue;
    const text = readFileSync(join(staging, "dist", file), "utf8");
    for (const match of text.matchAll(staticImport)) {
      const target = join(staging, "dist", file, "..", match[1]);
      if (!existsSync(target)) {
        throw new Error(
          `${name}: the staged dist/${file} imports ${match[1]}, which the staging does not hold`,
        );
      }
    }
  }
}

function buildPackage(name) {
  const packageDirectory = join(packagesRoot, name);
  const manifestPath = join(packageDirectory, "package.json");
  const source = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!existsSync(join(packageDirectory, "tsconfig.build.json"))) {
    throw new Error(`${name}: no tsconfig.build.json to build with`);
  }
  const profile = profileOf(packageDirectory, name);

  // 1. The emit, from scratch. `noEmitOnError` (the build configs hold it)
  //    keeps a failed build from leaving a file anywhere.
  const build = join(packageDirectory, ".build");
  rmSync(build, { recursive: true, force: true });
  execFileSync(process.execPath, [TSC, "-p", "tsconfig.build.json"], {
    cwd: packageDirectory,
    stdio: "inherit",
  });

  // 2. The staging tree, `dist/` beside the assets and fixtures the JS reads
  //    at run time.
  const staging = join(build, "pack");
  mkdirSync(staging, { recursive: true });
  stageDist(build, staging, profile, name);
  copyAssets(packageDirectory, staging, profile, name);
  copyFixtures(staging, profile, name);

  // 3. The staged manifest: the release version, no script, exact pins.
  const staged = {
    name: source.name,
    version: RELEASE_VERSION,
    description: source.description,
    license: source.license,
    type: source.type,
    engines: source.engines,
    exports: stagedExports(source.exports, profile, name),
    files: [
      "dist/",
      ...[...new Set((profile?.fixtureFiles ?? []).map((file) => `${file.split("/")[0]}/`))].sort(),
      ...(profile?.assetDirectories ?? ASSET_DIRECTORIES)
        .filter((directory) => existsSync(join(staging, directory)))
        .map((directory) => `${directory}/`),
      ...ASSET_FILES.filter((file) => existsSync(join(staging, file))),
    ],
    dependencies:
      profile?.computedDependencies === true
        ? computedDependencies(staging, name)
        : stagedDependencies(source.dependencies),
    publishConfig: { access: "public" },
  };
  checkStagedTree(staging, staged, name);
  writeFileSync(join(staging, "package.json"), `${JSON.stringify(staged, null, 2)}\n`);

  const bytes = (path) => statSync(join(staging, path)).size;
  const stagedCount = listStaged(join(staging, "dist")).length;
  process.stdout.write(
    `staged ${source.name}@${RELEASE_VERSION} in packages/${name}/.build/pack/` +
      ` (${bytes("dist")} bytes of dist, ${stagedCount} files)\n`,
  );
}

const names = process.argv.slice(2);
if (names.length === 0) {
  process.stderr.write("usage: node scripts/build-package.mjs <package-name> [package-name ...]\n");
  process.exit(2);
}
for (const name of names) buildPackage(name);
