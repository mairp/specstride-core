/**
 * T279 — the registration of the samples from the test tree (annex A, §A.4,
 * F100-FR-018; annex A, §A.3, F100-FR-012).
 *
 * `registerSamples()` imports every
 * `packages/testkit/src/samples/EP-nn/index.ts` and registers it with the
 * class `first-party` under its point. The samples live in the test tree
 * ONLY: the frame finds them by reading that directory, no core file names a
 * sample, and adding or removing a sample changes no core file. The check of
 * that last sentence is the second core rule of the import-boundary check
 * (T236), which this module calls in `coreFilesNamingASample()`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { coreNamingViolations, SAMPLE_PATHS } from "@specstride/import-boundary/src/core-names.ts";
import { loadGraph } from "@specstride/import-boundary/src/rules.ts";
import type { ImplementationClass } from "@specstride/contracts/ep/extension-point";
import {
  ROOT,
  loadExtensionPointIndex,
  registryOf,
  type Implementation,
  type ResolvedRecord,
} from "./frame.ts";

/** The one tree the samples live in, relative to the root of the repository. */
export const SAMPLES_DIR = "packages/testkit/src/samples" as const;

/** The name of the module of a sample inside its directory. */
export const SAMPLE_MODULE = "index.ts" as const;

/** F100-FR-018 — a sample of the test tree registers with this class. */
export const SAMPLE_CLASS: ImplementationClass = "first-party";

/** The rank a registration from the test tree carries. */
export const SAMPLE_PROVENANCE = "default" as const;

/** The shape a sample module exports (F100-FR-018). */
export type SampleModule = {
  /** The implementation the sample offers to the registry of its point. */
  readonly implementation: Implementation;
};

/** The directories of `src/samples/` that hold a sample, sorted by point. */
export function sampleDirectories(root: string = ROOT): readonly string[] {
  const dir = join(root, SAMPLES_DIR);
  if (!existsSync(dir)) return Object.freeze([]);
  return Object.freeze(
    readdirSync(dir)
      .filter((name) => /^EP-\d{2}$/.test(name))
      .filter((name) => statSync(join(dir, name)).isDirectory())
      .filter((name) => existsSync(join(dir, name, SAMPLE_MODULE)))
      .sort(),
  );
}

/** A point of the index whose sample the test tree does not hold. */
export class SampleMissingError extends Error {
  readonly missing: readonly string[];
  constructor(missing: readonly string[]) {
    super(
      `the test tree holds no sample of ${missing.join(", ")}; for each of EP-01 to EP-19 ` +
        `\`${SAMPLES_DIR}/EP-nn/${SAMPLE_MODULE}\` must hold one (F100-FR-018)`,
    );
    this.name = "SampleMissingError";
    this.missing = Object.freeze([...missing]);
  }
}

/**
 * F100-FR-018 — import every sample of the test tree and register it with the
 * class `first-party` under its point. Returns the records the registries
 * accepted, one per sample.
 */
export async function registerSamples(
  options: { readonly root?: string; readonly only?: readonly string[] } = {},
): Promise<readonly ResolvedRecord[]> {
  const root = options.root ?? ROOT;
  const index = loadExtensionPointIndex(root);
  const present = sampleDirectories(root);
  const wanted = options.only ?? index.map((e) => e.ep);
  const missing = wanted.filter((ep) => !present.includes(ep));
  if (missing.length > 0) throw new SampleMissingError(missing);

  const records: ResolvedRecord[] = [];
  for (const ep of wanted) {
    const module = (await import(`../samples/${ep}/index.ts`)) as Partial<SampleModule>;
    const implementation = module.implementation;
    if (implementation === undefined) {
      throw new Error(
        `\`${SAMPLES_DIR}/${ep}/${SAMPLE_MODULE}\` must export \`implementation\` ` +
          `(F100-FR-018)`,
      );
    }
    if (implementation.implementationClass !== SAMPLE_CLASS) {
      throw new Error(
        `the sample of ${ep} registers with the class \`${implementation.implementationClass}\`; ` +
          `a sample of the test tree registers with the class \`${SAMPLE_CLASS}\` (T279, F100-FR-018)`,
      );
    }
    const registry = registryOf(implementation.pointId, root);
    const already = registry.resolved().find((r) => r.implementationId === implementation.id);
    if (already !== undefined) {
      records.push(already);
      continue;
    }
    const outcome = registry.register(implementation);
    if (!outcome.accepted) {
      throw new Error(
        `the registry of ${ep} refused the sample \`${implementation.id}\`: ${outcome.message}`,
      );
    }
    records.push(outcome.record);
  }
  return Object.freeze(records);
}

/* ------------------------------------------------------------------ *
 * F100-FR-018 — no core file names a sample.
 * ------------------------------------------------------------------ */

/** The sample path a core file may never name (T236). */
export { SAMPLE_PATHS };

/** One core file that names a sample, with the line and the name. */
export type CoreNaming = {
  readonly file: string;
  readonly line: number;
  readonly name: string;
  readonly rule: string;
};

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(ts|mts|cts|js|mjs|cjs|json)$/.test(entry.name)) out.push(path);
  }
  return out;
}

/**
 * F100-FR-018, F100-FR-012 — every file of a core package of the graph that
 * names a sample of the test tree. An empty list is the pass: no core file
 * names a sample, so adding or removing a sample changes no core file.
 */
export function coreFilesNamingASample(root: string = ROOT): readonly CoreNaming[] {
  const graph = loadGraph(join(root, "packages/contracts/data/package-graph.json"));
  const out: CoreNaming[] = [];
  for (const pkg of graph.packages) {
    if (pkg.core !== true) continue;
    const dir = join(root, "packages", pkg.name.replace(/^@specstride\//, ""));
    for (const file of sourceFiles(join(dir, "src"))) {
      const content = readFileSync(file, "utf8");
      for (const violation of coreNamingViolations(graph, pkg.name, file, content)) {
        if (violation.rule !== "core:names-sample") continue;
        out.push({
          file: file.slice(root.length + 1),
          line: violation.line,
          name: violation.name,
          rule: violation.rule,
        });
      }
    }
  }
  return Object.freeze(out);
}

/** The core packages of the graph, by name (`core: true`). */
export function corePackages(root: string = ROOT): readonly string[] {
  const graph = loadGraph(join(root, "packages/contracts/data/package-graph.json"));
  return Object.freeze(graph.packages.filter((p) => p.core === true).map((p) => p.name));
}
