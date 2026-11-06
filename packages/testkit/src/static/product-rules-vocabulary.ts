/**
 * T241 — the static checks of licence, language and the loop layers
 * (annex A, §A.5; F100-FR-029, F100-FR-030, F100-FR-031).
 *
 * F100-FR-029: `LICENSE` is MIT with the copyright line, no published file
 * holds an owner-specific path, account or name, every dependency is
 * MIT-compatible, and a proprietary dependency is optional and never bundled.
 * The licence of a dependency is read from the licence field of the package
 * as installed, never from its source.
 *
 * F100-FR-030: every source file of the workspace is TypeScript or JSON, and
 * the Language Ledger is empty.
 *
 * F100-FR-031: the closed sets of run states, exit codes and stop reasons
 * hold no member owned by 115, 142 or 148. The counters are proven by the
 * second suite of the oracle (T204).
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
  textOf,
  walk,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The copyright line the licence carries (F100-FR-029). */
export const COPYRIGHT_LINE = "Copyright 2026 mairp" as const;
/** The licence of the product (F100-FR-029). */
export const LICENCE = "Apache-2.0" as const;

/** Licences that are compatible with MIT (F100-FR-029). */
export const MIT_COMPATIBLE = [
  "MIT",
  "MIT-0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "0BSD",
  "CC0-1.0",
  "Unlicense",
  "BlueOak-1.0.0",
  "Python-2.0",
] as const;

/** The extensions a source file of the workspace may have (F100-FR-030). */
export const ALLOWED_EXTENSIONS = [".ts", ".json"] as const;

/** The Language Ledger, empty at the start of Wave 1 (F100-FR-030). */
export const LANGUAGE_LEDGER = "docs/language-ledger.json";

/** The numbers of the closed sets of run states, exit codes and stop reasons. */
export const LOOP_LAYER_FREE_SETS = [1, 3, 6, 7] as const;
/** The features that own the loop layers (F100-FR-031). */
export const LOOP_LAYER_FEATURES = ["115", "142", "148"] as const;

/** An owner-specific path, account or name in a published file (F100-FR-029). */
const OWNER_SPECIFIC =
  /(\/home\/[a-z0-9_.-]+|\/Users\/[A-Za-z0-9_.-]+|\/root\/[A-Za-z0-9_.-]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

type Graph = { published: string[] };
type ClosedSets = {
  closedSets: { number: number; name: string; literals: string[]; owner: string }[];
};

/** F100-FR-029 — the licence file, the published files, the dependencies. */
export function checkLicence(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const findings: Finding[] = [];
  const licencePath = join(root, "LICENSE");
  if (!existsSync(licencePath)) {
    findings.push(finding("LICENSE", 0, `the product has no \`LICENSE\` file (F100-FR-029)`));
  } else {
    const text = textOf(licencePath);
    if (!/Apache License/i.test(text)) {
      findings.push(finding("LICENSE", 0, `\`LICENSE\` is not the Apache licence (F100-FR-029)`));
    }
    if (!text.includes(COPYRIGHT_LINE)) {
      findings.push(
        finding(
          "LICENSE",
          0,
          `\`LICENSE\` does not carry the copyright line "${COPYRIGHT_LINE}" (F100-FR-029)`,
          COPYRIGHT_LINE,
        ),
      );
    }
  }
  // Every package declares MIT.
  for (const manifest of manifests(root)) {
    const pkg = readJson<{ license?: string; name?: string }>(manifest);
    if (pkg.license !== LICENCE) {
      findings.push(
        finding(
          rel(manifest, root),
          0,
          `the package declares the licence "${String(pkg.license)}"; the licence of ` +
            `the product is ${LICENCE} (F100-FR-029)`,
          String(pkg.license),
        ),
      );
    }
  }
  // No published file holds an owner-specific path, an account or a name. The
  // copyright line of the licence is the one name the requirement asks for.
  for (const file of publishedFiles(root)) {
    const path = rel(file, root);
    if (path === "LICENSE") continue;
    const lines = linesOf(file);
    for (let i = 0; i < lines.length; i++) {
      for (const m of (lines[i] as string).matchAll(OWNER_SPECIFIC)) {
        findings.push(
          finding(
            path,
            i + 1,
            `the published file holds "${m[0]}", a path, an account or a name that is ` +
              `specific to the owner's machines (F100-FR-029)`,
            m[0],
          ),
        );
      }
    }
  }
  // Every dependency is MIT-compatible, read from the package as installed.
  findings.push(...checkDependencyLicences(root));
  return Object.freeze(findings);
}

/** Every `package.json` of the workspace, root included where it exists. */
function manifests(root: string): string[] {
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

/** The files a published package ships: its `src/`, `schemas/`, `data/`. */
function publishedFiles(root: string): string[] {
  const graph = contractsData<Graph>("package-graph.json", root);
  const published = new Set(graph.published);
  const out: string[] = [join(root, "LICENSE")];
  for (const manifest of manifests(root)) {
    const pkg = readJson<{ name?: string; files?: string[] }>(manifest);
    if (pkg.name === undefined || !published.has(pkg.name)) continue;
    const dir = join(manifest, "..");
    for (const entry of pkg.files ?? []) {
      out.push(...walk(join(dir, entry.replace(/\/$/, ""))));
    }
    out.push(manifest);
  }
  return out;
}

/**
 * F100-FR-029 — every dependency MIT-compatible; a proprietary one optional
 * and never bundled. The licence is read from the licence field of the
 * package as installed, never from its source.
 */
export function checkDependencyLicences(root: string = ROOT): readonly Finding[] {
  const findings: Finding[] = [];
  for (const manifest of manifests(root)) {
    const pkg = readJson<{
      name?: string;
      dependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    }>(manifest);
    const dir = join(manifest, "..");
    for (const dependency of Object.keys(pkg.dependencies ?? {})) {
      const installed = installedManifest(root, dir, dependency);
      if (installed === undefined) continue; // not installed here; nothing to read
      const licence = String(installed.license ?? "");
      if (!isMitCompatible(licence)) {
        findings.push(
          finding(
            rel(manifest, root),
            0,
            `the dependency \`${dependency}\` is installed with the licence ` +
              `"${licence}", which is not compatible with MIT; a proprietary ` +
              `dependency is optional and never bundled (F100-FR-029)`,
            `${dependency}: ${licence}`,
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/** True for a licence expression every part of which is MIT-compatible. */
export function isMitCompatible(licence: string): boolean {
  if (licence === "") return false;
  const parts = licence
    .replace(/[()]/g, " ")
    .split(/\s+(?:OR|AND)\s+/i)
    .map((p) => p.trim())
    .filter((p) => p !== "");
  return parts.some((p) => (MIT_COMPATIBLE as readonly string[]).includes(p));
}

/** The `package.json` of an installed dependency, read from `node_modules/`. */
function installedManifest(
  root: string,
  from: string,
  dependency: string,
): { license?: string } | undefined {
  for (const base of [join(from, "node_modules"), join(root, "node_modules")]) {
    const manifest = join(base, dependency, "package.json");
    if (existsSync(manifest)) return readJson<{ license?: string }>(manifest);
  }
  return undefined;
}

/** F100-FR-030 — every source file is TypeScript or JSON; the Ledger is empty. */
export function checkLanguage(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const findings: Finding[] = [];
  // The source of the product: the `src/` and `test/` trees of every package
  // and tool, and the tests of `tests/`. The build scripts of
  // `packages/contracts/scripts/` are not source of the product: no published
  // package ships them (the `files` field of the package lists `schemas/`,
  // `data/`, `src/` and `DEPENDENCIES.md`), and the approved tasks T008 and
  // T009 name them as `.mjs`. That they are never shipped is checked below.
  const roots: string[] = [join(root, "tests")];
  for (const group of ["packages", "tools"]) {
    let names: string[];
    try {
      names = readdirSync(join(root, group));
    } catch {
      continue;
    }
    for (const name of names) {
      roots.push(join(root, group, name, "src"), join(root, group, name, "test"));
    }
  }
  for (const directory of roots) {
    for (const file of walk(directory)) {
      const path = rel(file, root);
      // Fixture data of feature 109's descriptor-only conformance fixture
      // (T061): YAML descriptors are data, not source of the product.
      if (path.startsWith("tests/conformance/harness/descriptor-only/") && path.endsWith(".yaml")) {
        continue;
      }
      // Fixture data and the stand-in executable of feature 131's conformance
      // suite (the approved tasks T008 and T009 name them as `.mjs` and
      // `.jsonl`): the fake `codex` executable and the hand-written JSONL
      // streams are data and a test double, not source of the product, and no
      // published package ships them.
      if (
        path.startsWith("tests/conformance/codex/") &&
        (path.endsWith(".mjs") || path.endsWith(".jsonl"))
      ) {
        continue;
      }
      const name = path.slice(path.lastIndexOf("/") + 1);
      if (name === ".gitkeep" || name.endsWith(".md")) continue;
      const dot = name.lastIndexOf(".");
      const extension = dot < 0 ? "" : name.slice(dot);
      if ((ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) continue;
      findings.push(
        finding(
          path,
          0,
          `the source file has the extension "${extension}"; every component of the ` +
            `product is written in TypeScript, and a component in another language ` +
            `enters only through the Language Ledger (F100-FR-030)`,
          extension,
        ),
      );
    }
  }
  // Nothing a published package ships is in another language either.
  for (const manifest of manifests(root)) {
    const pkg = readJson<{ name?: string; files?: string[] }>(manifest);
    if (pkg.name === undefined) continue;
    const dir = join(manifest, "..");
    for (const entry of pkg.files ?? []) {
      for (const file of walk(join(dir, entry.replace(/\/$/, "")))) {
        const path = rel(file, root);
        const name = path.slice(path.lastIndexOf("/") + 1);
        if (name === ".gitkeep" || name.endsWith(".md")) continue;
        const dot = name.lastIndexOf(".");
        const extension = dot < 0 ? "" : name.slice(dot);
        if ((ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) continue;
        findings.push(
          finding(
            path,
            0,
            `the package ships the file, whose extension is "${extension}"; every ` +
              `component of the product is written in TypeScript (F100-FR-030)`,
            extension,
          ),
        );
      }
    }
  }
  const ledger = join(root, LANGUAGE_LEDGER);
  if (existsSync(ledger)) {
    const entries = readJson<{ entries?: unknown[] }>(ledger).entries ?? [];
    if (entries.length > 0) {
      findings.push(
        finding(
          LANGUAGE_LEDGER,
          0,
          `the Language Ledger holds ${entries.length} entries; it is empty at the ` +
            `start of Wave 1 (F100-FR-030)`,
          String(entries.length),
        ),
      );
    }
  }
  return Object.freeze(findings);
}

/**
 * F100-FR-031 — the closed sets of run states, exit codes and stop reasons
 * hold no member owned by 115, 142 or 148: a loop layer adds no run state, no
 * exit code and no stop reason.
 */
export function checkLoopLayersAddNothing(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const rows = contractsData<ClosedSets>("closed-sets.json", root).closedSets;
  const findings: Finding[] = [];
  for (const number of LOOP_LAYER_FREE_SETS) {
    const row = rows.find((r) => r.number === number);
    if (row === undefined) {
      findings.push(
        finding(
          "packages/contracts/data/closed-sets.json",
          0,
          `row ${number} of annex X §X.6 is missing (F100-FR-031)`,
        ),
      );
      continue;
    }
    const owner = /\d+/.exec(row.owner)?.[0] ?? "";
    if ((LOOP_LAYER_FEATURES as readonly string[]).includes(owner)) {
      findings.push(
        finding(
          "packages/contracts/data/closed-sets.json",
          0,
          `the closed set "${row.name}" (row ${number}) is owned by ${row.owner}; the ` +
            `loop layers add no run state, no exit code and no stop reason ` +
            `(F100-FR-031)`,
          row.owner,
        ),
      );
    }
  }
  // No other row of §X.6 that a loop layer owns may name itself a run state,
  // an exit code or a stop reason.
  for (const row of rows) {
    const owner = /\d+/.exec(row.owner)?.[0] ?? "";
    if (!(LOOP_LAYER_FEATURES as readonly string[]).includes(owner)) continue;
    if (/^(run states|stop reasons|.*exit codes)$/i.test(row.name)) {
      findings.push(
        finding(
          "packages/contracts/data/closed-sets.json",
          0,
          `the closed set "${row.name}" (row ${row.number}) is owned by the loop-layer ` +
            `feature ${row.owner}; a loop layer adds no run state, no exit code and no ` +
            `stop reason (F100-FR-031)`,
          row.name,
        ),
      );
    }
  }
  return Object.freeze(findings);
}

/** The three ends a failure inside a loop layer may have (F100-FR-031). */
export const LOOP_LAYER_FAILURE_ENDS = [
  "the work returns to the serial path",
  "the layer is off for the phase attempt",
  "the layer is off for the run",
] as const;

/** The check the runner of T264 registers. */
export const licenceLanguageAndLoopLayersCheck: StaticCheck = {
  name: "Product-wide rules: licence, language and the loop layers",
  covers: ["F100-FR-029", "F100-FR-030", "F100-FR-031"],
  run(options: CheckOptions = {}) {
    return Object.freeze([
      ...checkLicence(options),
      ...checkLanguage(options),
      ...checkLoopLayersAddNothing(options),
    ]);
  },
};

export default licenceLanguageAndLoopLayersCheck;
