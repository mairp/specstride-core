/**
 * T240 — the static checks of packaging (annex A, §A.5; F100-FR-026,
 * F100-FR-027, F100-FR-028).
 *
 * F100-FR-026: no package of the graph, no schema and no data file names a
 * state directory of the three as-is systems outside
 * `data/layout-old-side.json`; no legacy command name, legacy variable name
 * or migration of a pre-v2 layout is carried.
 *
 * F100-FR-027: the root `package.json` and every package have no install
 * script and no compile step, and every dependency of a published package is
 * declared at an exact version, never a range.
 *
 * F100-FR-028: the shipped package has the audience `distributed` in its data
 * and the audience key `distribution.audience` is settable through user
 * configuration only.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  contractsData,
  finding,
  linesOf,
  readJson,
  rel,
  walk,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The one file that may name the as-is state directories (F100-FR-026). */
export const OLD_SIDE_FILE = "packages/contracts/data/layout-old-side.json";

/** The scripts npm runs at install; a published package has none (F100-FR-027). */
export const INSTALL_SCRIPTS = [
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
  "preprepare",
  "postprepare",
] as const;

/** A version that is a range, not an exact version (F100-FR-027). */
export const RANGE = /^[\^~>=<*]|\s-\s|\|\||^latest$|\.x$/;

/** The audience the shipped package has (F100-FR-028). */
export const SHIPPED_AUDIENCE = "distributed" as const;
/** The key that carries it. */
export const AUDIENCE_KEY = "distribution.audience" as const;
/** The one rank that may set it (F100-FR-028). */
export const AUDIENCE_RANK = "User configuration" as const;

/**
 * The legacy command names of the three as-is systems, read from the
 * `asIsPaths` of `data/layout-old-side.json`: every shell or Python script of
 * a baseline. They are read from the data so that this check names none of
 * them itself (F100-FR-026).
 */
export function legacyNames(root: string = ROOT): readonly string[] {
  const old = contractsData<OldSide>("layout-old-side.json", root);
  const names = new Set<string>();
  for (const item of old.items ?? []) {
    for (const path of item.asIsPaths ?? []) {
      for (const m of String(path).matchAll(/[A-Za-z0-9_.-]+\.(?:sh|py)\b/g)) names.add(m[0]);
    }
  }
  return Object.freeze([...names].sort());
}

type OldSide = {
  placeholders: Record<string, string>;
  items?: { asIsPaths?: string[] }[];
};
type Graph = { published: string[]; builtByFeature100: string[]; packages: { name: string }[] };
type Profile = { switches: { number: number; keys: string[]; default: string; parity: string }[] };
type Ranks = { ranks: { Rank: string; Layer: string }[] };

/** The as-is directory placeholders, from the `placeholders` key of the old side. */
export function asIsDirectoryPlaceholders(root: string = ROOT): readonly string[] {
  const old = contractsData<OldSide>("layout-old-side.json", root);
  return Object.freeze([
    ...new Set(
      Object.keys(old.placeholders)
        .flatMap((k) => k.split(","))
        .map((k) => k.trim())
        .filter((k) => k.startsWith("<") || k.includes("/")),
    ),
  ]);
}

/** Every file of `packages/` and `tools/`, the old-side data file apart. */
function packageFiles(root: string): string[] {
  return [join(root, "packages"), join(root, "tools")]
    .flatMap((d) => walk(d))
    .filter((f) => rel(f, root) !== OLD_SIDE_FILE);
}

/**
 * F100-FR-026 — no package, schema or data file names a state directory of
 * the three as-is systems. A placeholder counts as a directory only where it
 * is used as a path component: `state=<state>` in a line grammar names a
 * field, not a directory.
 */
export function checkNoAsIsStateDirectory(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const placeholders = asIsDirectoryPlaceholders(root);
  const legacy_names = legacyNames(root);
  const findings: Finding[] = [];
  for (const file of packageFiles(root)) {
    const path = rel(file, root);
    const lines = linesOf(file);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      for (const placeholder of placeholders) {
        const at = line.indexOf(placeholder);
        if (at < 0) continue;
        const before = line[at - 1];
        const after = line[at + placeholder.length];
        const isPathComponent =
          placeholder.includes("/") || before === "/" || after === "/" || after === "\\";
        if (!isPathComponent) continue;
        findings.push(
          finding(
            path,
            i + 1,
            `the file names the as-is state directory "${placeholder}" of one of the ` +
              `three as-is systems; only \`${OLD_SIDE_FILE}\` may (F100-FR-026)`,
            placeholder,
          ),
        );
      }
      for (const legacy of legacy_names) {
        if (line.includes(legacy)) {
          findings.push(
            finding(
              path,
              i + 1,
              `the file carries the legacy name "${legacy}"; legacy command names and ` +
                `legacy variable names are not carried (F100-FR-026)`,
              legacy,
            ),
          );
        }
      }
    }
  }
  return Object.freeze(findings);
}

/** Every `package.json` of the workspace, root included. */
export function packageManifests(root: string = ROOT): string[] {
  const rootManifest = join(root, "package.json");
  const out = existsSync(rootManifest) ? [rootManifest] : [];
  for (const group of ["packages", "tools"]) {
    let names: string[];
    try {
      names = readdirSync(join(root, group));
    } catch {
      continue;
    }
    for (const name of names) {
      const manifest = join(root, group, name, "package.json");
      if (existsSync(manifest)) out.push(manifest);
    }
  }
  return out;
}

/**
 * F100-FR-027 — no install script, no compile step, and every dependency of a
 * published package at an exact version.
 */
export function checkPackaging(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const graph = contractsData<Graph>("package-graph.json", root);
  const published = new Set(graph.published);
  const findings: Finding[] = [];
  for (const manifest of packageManifests(root)) {
    const path = rel(manifest, root);
    const pkg = readJson<{
      name?: string;
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(manifest);
    const scripts = pkg.scripts ?? {};
    for (const script of INSTALL_SCRIPTS) {
      if (scripts[script] !== undefined) {
        findings.push(
          finding(
            path,
            0,
            `the package has the install script \`${script}\`; installing a package of ` +
              `the product runs no install script (F100-FR-027)`,
            script,
          ),
        );
      }
    }
    // No compile step: nothing is compiled at install or at publish.
    for (const [name, body] of Object.entries(scripts)) {
      if (!INSTALL_SCRIPTS.includes(name as (typeof INSTALL_SCRIPTS)[number])) continue;
      if (/tsc|rollup|esbuild|webpack|babel|node-gyp/.test(body)) {
        findings.push(
          finding(
            path,
            0,
            `the install script \`${name}\` compiles; installing a package of the ` +
              `product compiles nothing (F100-FR-027)`,
            name,
          ),
        );
      }
    }
    // Every dependency of a published package at an exact version.
    const isPublished = pkg.name !== undefined && published.has(pkg.name);
    const groups: [string, Record<string, string>][] = [
      ["dependencies", pkg.dependencies ?? {}],
      ["devDependencies", pkg.devDependencies ?? {}],
    ];
    for (const [group, deps] of groups) {
      if (group === "devDependencies" && !isPublished && pkg.name !== undefined) continue;
      for (const [dependency, range] of Object.entries(deps)) {
        if (RANGE.test(range)) {
          findings.push(
            finding(
              path,
              0,
              `the dependency \`${dependency}\` is declared as "${range}", a range; ` +
                `every dependency is declared at an exact version (F100-FR-027)`,
              `${dependency}@${range}`,
            ),
          );
        }
      }
    }
  }
  return Object.freeze(findings);
}

/**
 * F100-FR-028 — the shipped package has the audience `distributed` in its
 * data, and `distribution.audience` is settable through user configuration
 * only: never through the environment, a flag, project configuration or the
 * consumer's comment.
 */
export function checkAudience(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const findings: Finding[] = [];
  const profile = contractsData<Profile>("parity-profile.json", root);
  const row = profile.switches.find((r) =>
    r.keys.some((k) => k.replace(/`/g, "") === AUDIENCE_KEY),
  );
  if (row === undefined) {
    findings.push(
      finding(
        "packages/contracts/data/parity-profile.json",
        0,
        `the profile holds no row for the audience key \`${AUDIENCE_KEY}\` ` + `(F100-FR-028)`,
        AUDIENCE_KEY,
      ),
    );
  }
  const ranks = contractsData<Ranks>("config-ranks.json", root).ranks.map((r) => r.Layer);
  if (!ranks.includes(AUDIENCE_RANK)) {
    findings.push(
      finding(
        "packages/contracts/data/config-ranks.json",
        0,
        `the ranks of configuration name no layer "${AUDIENCE_RANK}"; the audience is ` +
          `settable through user configuration only (F100-FR-028)`,
        AUDIENCE_RANK,
      ),
    );
  }
  // The audience must not be reachable through the environment: no alias of
  // the key exists in the environment alias table.
  const normalization = contractsData<{
    environmentAliases: { "As-is variable": string; Key: string }[];
  }>("normalization.json", root);
  for (const alias of normalization.environmentAliases) {
    if (
      alias.Key.replace(/`/g, "")
        .split(",")
        .map((k) => k.trim())
        .includes(AUDIENCE_KEY)
    ) {
      findings.push(
        finding(
          "packages/contracts/data/normalization.json",
          0,
          `the environment alias table names \`${AUDIENCE_KEY}\`; the audience never ` +
            `changes through the environment (F100-FR-028)`,
          AUDIENCE_KEY,
        ),
      );
    }
  }
  // The shipped package declares the audience `distributed` in its data: the
  // default of the row of the audience key in `data/parity-profile.json`.
  if (row !== undefined) {
    const shipped = String((row as unknown as { default?: string }).default ?? "")
      .replace(/`/g, "")
      .trim();
    if (shipped !== SHIPPED_AUDIENCE) {
      findings.push(
        finding(
          "packages/contracts/data/parity-profile.json",
          0,
          `the row of \`${AUDIENCE_KEY}\` gives the shipped audience as "${shipped}"; ` +
            `the package as shipped has the audience \`${SHIPPED_AUDIENCE}\` ` +
            `(F100-FR-028)`,
          shipped,
        ),
      );
    }
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers. */
export const packagingCheck: StaticCheck = {
  name: "Product-wide rules: packaging",
  covers: ["F100-FR-026", "F100-FR-027", "F100-FR-028"],
  run(options: CheckOptions = {}) {
    return Object.freeze([
      ...checkNoAsIsStateDirectory(options),
      ...checkPackaging(options),
      ...checkAudience(options),
    ]);
  },
};

export default packagingCheck;
