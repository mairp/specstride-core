/**
 * The release packer of the split (phase 3): it stages the four published
 * packages of the `published` key of
 * `packages/contracts/data/package-graph.json` and packs them into
 * `.build/release/`, one tarball each, printing the name, the version and
 * the sha256 of every tarball, and writing the same facts beside them as
 * `release.json` for the steps that consume the tarballs (the publish job
 * of `release.yml`, and later the pin script of a plugin repository).
 *
 * The packer stages nothing itself: it runs the two staging writers and
 * then packs what they wrote.
 *
 * - `specstride`: `packages/cli/scripts/pack.mjs` bundles the CLI and packs
 *   its staged tree; the packer copies that tarball into the release
 *   directory, so the bytes a version publishes are the bytes the CLI pack
 *   built (one pack, never two).
 * - the three `@specstride` packages: `scripts/build-package.mjs` emits
 *   built JavaScript and declarations and stages the publish-ready tree
 *   (testkit a subset surface, per its `staging.json`); the packer runs
 *   `npm pack` in each staged tree, with `--pack-destination` pointed at
 *   the release directory.
 *
 * Guards:
 *
 * - the root manifest's `version` must be a release version (`X.Y.Z`): it
 *   is the ONE release version of the four packages (docs/PUBLISHING.md);
 * - every STAGED manifest's `version` must equal that constant, and no
 *   staged manifest may define a `scripts` field. This step runs AFTER the
 *   two writers have just written those manifests, so it is the guard
 *   against a WRITER that mis-stages — one that emits a source manifest's
 *   `0.0.0`, or a staged tree that grew a script — and nothing is packed
 *   until every staged tree passes it. The SOURCE manifests keep `0.0.0`
 *   (their exact pins are load-bearing for the workspace install); the
 *   staged trees, the manifests a version is published from, are what the
 *   guard reads;
 * - the release directory holds nothing but the four tarballs and the
 *   sidecar: it is emptied on every run, so no stale tarball of an older
 *   build can be mistaken for this one.
 *
 * The digests are printed and recorded as `sha256-<hex>`; they bind a
 * tarball to the release (the publish attestation carries the same digest,
 * and a plugin repository checks the tarballs it pins against them).
 *
 * `.build/` stays git-ignored: everything this script writes is a build
 * artifact.
 *
 * Usage: `node scripts/pack-release.mjs`.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const releaseDirectory = join(repositoryRoot, ".build", "release");
const CLI_PACKAGE_DIRECTORY = join(repositoryRoot, "packages", "cli");
/** The package directory of the unscoped CLI, whose staged tree `pack.mjs` writes. */
const CLI_PACKAGE_NAME = "specstride";

const ROOT_MANIFEST = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8"));
/** The ONE release version of the four published packages (the split, phase 3). */
const RELEASE_VERSION = ROOT_MANIFEST.version;
const TARBALL_OF_NAME = (name) =>
  `${name.replace(/^@/, "").replace("/", "-")}-${RELEASE_VERSION}.tgz`;

/** The npm the repository runs with (the resolution `pack.mjs` already uses). */
function npmCli() {
  return join(dirname(process.execPath), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js");
}

function refuse(message) {
  process.stderr.write(`pack-release: ${message}\n`);
  process.exit(1);
}

/** The published set, in the graph's order, mapped to its package directories. */
function publishedPackages() {
  const graph = JSON.parse(
    readFileSync(join(repositoryRoot, "packages/contracts/data/package-graph.json"), "utf8"),
  );
  const published = graph.published;
  if (!Array.isArray(published) || published.length === 0) {
    refuse("package-graph.json holds no non-empty `published` key");
  }
  const packages = published.map((name) => {
    const directory =
      name === CLI_PACKAGE_NAME
        ? CLI_PACKAGE_DIRECTORY
        : join(repositoryRoot, "packages", String(name).slice("@specstride/".length));
    if (!existsSync(join(directory, "package.json"))) {
      refuse(`${name} of the \`published\` key has no package directory at ${directory}`);
    }
    return { name, directory };
  });
  return packages;
}

/** The staged manifest of one published package, with the guards of this script. */
function stagedManifestOf(entry) {
  const path = join(entry.directory, ".build", "pack", "package.json");
  if (!existsSync(path)) {
    refuse(`${entry.name}: no staged tree at ${path} — run the staging writers first`);
  }
  const staged = JSON.parse(readFileSync(path, "utf8"));
  if (staged.version !== RELEASE_VERSION) {
    refuse(
      `${entry.name}: the staged manifest holds version ${staged.version}, ` +
        `not the release version ${RELEASE_VERSION} — the staging writer mis-staged it`,
    );
  }
  if (staged.scripts !== undefined) {
    refuse(`${entry.name}: the staged manifest defines scripts`);
  }
  return staged;
}

/** The sha256 hex digest of one file, read once. */
function sha256Of(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/** `npm pack` one staged tree into the release directory; returns the tarball file name. */
function packStaged(directory) {
  const packed = execFileSync(
    process.execPath,
    [npmCli(), "pack", "--json", "--pack-destination", releaseDirectory],
    { cwd: directory, encoding: "utf8" },
  );
  const [row] = JSON.parse(packed);
  if (row?.filename === undefined) {
    refuse(`npm pack of ${directory} named no tarball file`);
  }
  return row.filename;
}

const packages = publishedPackages();
if (!/^\d+\.\d+\.\d+$/.test(RELEASE_VERSION ?? "")) {
  refuse(
    `the root manifest's version is ${JSON.stringify(RELEASE_VERSION)}, not a release version`,
  );
}

// 1. The staging, from scratch: the CLI pack, then the three @specstride
//    packages in the graph's order.
execFileSync(process.execPath, [join(CLI_PACKAGE_DIRECTORY, "scripts", "pack.mjs")], {
  cwd: repositoryRoot,
  stdio: "inherit",
});
const builtPackages = packages.filter((entry) => entry.name !== CLI_PACKAGE_NAME);
execFileSync(
  process.execPath,
  [
    join(repositoryRoot, "scripts", "build-package.mjs"),
    ...builtPackages.map((entry) => entry.name.slice("@specstride/".length)),
  ],
  { cwd: repositoryRoot, stdio: "inherit" },
);

// 2. The guards, over the staged trees the two writers just wrote.
for (const entry of packages) stagedManifestOf(entry);

// 3. The release directory, emptied and refilled: no stale tarball survives.
rmSync(releaseDirectory, { recursive: true, force: true });
mkdirSync(releaseDirectory, { recursive: true });

// 4. The tarballs: the CLI's copied (one pack, the bytes pack.mjs built),
//    the three staged trees packed straight into the release directory.
const cliTarball = join(CLI_PACKAGE_DIRECTORY, ".build", TARBALL_OF_NAME(CLI_PACKAGE_NAME));
if (!existsSync(cliTarball)) {
  refuse(`the CLI pack wrote no ${TARBALL_OF_NAME(CLI_PACKAGE_NAME)} beside its staging`);
}
const files = new Map();
for (const entry of packages) {
  if (entry.name === CLI_PACKAGE_NAME) {
    copyFileSync(cliTarball, join(releaseDirectory, TARBALL_OF_NAME(entry.name)));
    files.set(entry.name, TARBALL_OF_NAME(entry.name));
  } else {
    files.set(entry.name, packStaged(join(entry.directory, ".build", "pack")));
  }
  const file = files.get(entry.name);
  if (!existsSync(join(releaseDirectory, file))) {
    refuse(`${entry.name}: the release directory holds no ${file}`);
  }
}

// 5. The names and digests, printed and recorded beside the tarballs.
const released = packages.map((entry) => {
  const file = files.get(entry.name);
  const digest = `sha256-${sha256Of(join(releaseDirectory, file))}`;
  process.stdout.write(`released ${entry.name}@${RELEASE_VERSION} ${digest} ${file}\n`);
  return {
    name: entry.name,
    version: RELEASE_VERSION,
    file,
    sha256: digest.slice("sha256-".length),
  };
});
writeFileSync(join(releaseDirectory, "release.json"), `${JSON.stringify(released, null, 2)}\n`);

// 6. The closed set: nothing but the four tarballs and the sidecar.
const leftovers = readdirSync(releaseDirectory).filter(
  (entry) => entry !== "release.json" && !released.some((row) => row.file === entry),
);
if (leftovers.length > 0) {
  refuse(`the release directory holds the unexpected ${leftovers.join(", ")}`);
}
const bytes = (file) => statSync(join(releaseDirectory, file)).size;
for (const row of released) {
  process.stdout.write(`${row.file} ${bytes(row.file)} bytes\n`);
}
process.stdout.write(`release.json written to ${join(".build", "release", "release.json")}\n`);
