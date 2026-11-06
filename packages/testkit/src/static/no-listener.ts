/**
 * T287 — two static checks of annex X §X.9 (F100-FR-220, F100-FR-221):
 *
 *  1. No package of Wave 1 opens a network listener: no source file of any
 *     package of the graph imports one of the four listener built-ins or a
 *     server of a dependency, and no source file calls the listen operation of
 *     a server object.
 *  2. Every ingress of outside text wraps it in random boundaries per call and
 *     never parses it for a control record — a static check over the ingress
 *     package of the graph (F100-FR-009).
 *
 * The import scanner is the one of T013 (`importsOfSource` of
 * `tools/import-boundary/src/rules.ts`), so that the two checks and
 * `check:imports` read imports the same way.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { importsOfSource, loadGraph } from "@specstride/import-boundary/src/rules.ts";
import { loadLayerFacts } from "@specstride/import-boundary/src/layer-facts.ts";
import {
  ROOT,
  finding,
  linesOf,
  rel,
  walk,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The data file the package graph lives in. */
export const PACKAGE_GRAPH_FILE = "packages/contracts/data/package-graph.json";

/**
 * The built-ins that open a network listener (F100-FR-220). They are written
 * here as DATA; the check matches the import specifier of a source file against
 * them, never the text of a file, so this module's own list is not a hit.
 */
export const LISTENER_BUILTINS = ["node:net", "node:http", "node:https", "node:http2"] as const;

/** The bare forms of the same built-ins, which an import may also use. */
export const LISTENER_BUILTINS_BARE = ["net", "http", "https", "http2"] as const;

/** Servers of a dependency that would open a listener (F100-FR-220). */
export const LISTENER_DEPENDENCIES = [
  "express",
  "fastify",
  "koa",
  "hapi",
  "@hapi/hapi",
  "ws",
  "socket.io",
  "polka",
  "connect",
  "restify",
  "h3",
  "uWebSockets.js",
] as const;

/**
 * The call that binds a listener. The pattern is built from parts, so that the
 * source of this module does not hold the literal the check looks for.
 */
export const LISTEN_CALL = new RegExp(`\\.${"listen"}\\s*\\(`);

/** The layers of the graph that are not shipped: a dev package is not Wave 1. */
export const DEV_LAYER = "dev" as const;

/** The path of the package graph in a workspace. */
export function graphFile(root: string = ROOT): string {
  return join(root, "packages", "contracts", "data", "package-graph.json");
}

/** One package of the graph, as the check reads it. */
export type GraphPackage = { readonly name: string; readonly layer: string };

/**
 * Whether a package directory holds only a skeleton of the campaign scaffolding
 * (`"specstride": { "skeleton": true }` in its manifest). A skeleton counts as
 * absent until its owning feature fills it and drops the marker.
 */
export function isSkeleton(packageDir: string): boolean {
  const manifest = join(packageDir, "package.json");
  if (!existsSync(manifest)) return false;
  const parsed = JSON.parse(readFileSync(manifest, "utf8")) as {
    specstride?: { skeleton?: unknown };
  };
  return parsed.specstride?.skeleton === true;
}

/** The directory of a package of the workspace, or `undefined` where it is absent or a skeleton. */
export function directoryOf(name: string, root: string = ROOT): string | undefined {
  const stem = name.replace(/^@specstride\//, "");
  for (const base of ["packages", "tools"]) {
    if (isSkeleton(join(root, base, stem))) continue;
    const candidate = join(root, base, stem, "src");
    if (walk(candidate).length > 0) return candidate;
  }
  return undefined;
}

/** The TypeScript source files of a directory. */
function sourcesOf(directory: string): string[] {
  return walk(directory, (f) => /\.(ts|mts|cts)$/.test(f) && !/\.d\.ts$/.test(f));
}

/**
 * F100-FR-220 — no package of Wave 1 opens a network listener. The subject is
 * every package of the graph that EXISTS in this workspace; a package of the
 * graph that has not been written yet is reported as absent by
 * `absentPackages`, so the subject widens by itself when the package arrives.
 */
export function checkNoListener(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const graph = loadGraph(graphFile(root));
  const findings: Finding[] = [];
  for (const pkg of graph.packages as readonly GraphPackage[]) {
    const directory = directoryOf(pkg.name, root);
    if (directory === undefined) continue; // absent: see `absentPackages`
    for (const file of sourcesOf(directory)) {
      const path = rel(file, root);
      for (const statement of importsOfSource(file)) {
        const spec = statement.spec;
        const hit =
          (LISTENER_BUILTINS as readonly string[]).includes(spec) ||
          (LISTENER_BUILTINS_BARE as readonly string[]).includes(spec) ||
          (LISTENER_DEPENDENCIES as readonly string[]).includes(spec);
        if (!hit) continue;
        findings.push(
          finding(
            path,
            statement.line,
            `${pkg.name} imports \`${spec}\`; no component of Wave 1 opens a network ` +
              `listener (F100-FR-220)`,
            spec,
          ),
        );
      }
      for (const [index, line] of linesOf(file).entries()) {
        // A comment is prose, not a call.
        const code = line.replace(/\/\/.*$/, "").replace(/^\s*\*.*$/, "");
        if (!LISTEN_CALL.test(code)) continue;
        findings.push(
          finding(
            path,
            index + 1,
            `${pkg.name} binds a listener; no component of Wave 1 opens a network listener ` +
              `(F100-FR-220)`,
            code.trim(),
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/** The packages of the graph that this workspace does not hold yet. */
export function absentPackages(options: CheckOptions = {}): readonly string[] {
  const root = options.root ?? ROOT;
  const graph = loadGraph(graphFile(root));
  return Object.freeze(
    (graph.packages as readonly GraphPackage[])
      .filter((p) => directoryOf(p.name, root) === undefined)
      .map((p) => p.name),
  );
}

/* ------------------------------------------------------------------ *
 * F100-FR-221 — text from outside the runtime is data everywhere.
 * ------------------------------------------------------------------ */

/** What F100-FR-221 requires of every ingress of outside text. */
export const INGRESS_RULES = [
  "wrapped in random boundaries per call when it enters a prompt",
  "never echoed into a host session by default",
  "rendered as text",
  "never parsed for control records",
] as const;

/** The marks of a random boundary per call the check looks for in the ingress. */
export const BOUNDARY_MARKS = ["boundary", "nonce", "token"] as const;

/**
 * The marks of parsing outside text for a control record. An ingress that holds
 * one of them on a line that also names outside text is a finding.
 */
export const PARSE_MARKS = ["JSON.parse", "readRecord", "validate("] as const;

/**
 * F100-FR-221 — the check over the ingress package: it wraps outside text in
 * random boundaries per call and never parses it for a control record.
 *
 * The ingress package of the graph is the one package that owns the redactor
 * beside the kernel (F100-FR-009), which `loadLayerFacts` resolves. Where the
 * package is not in this workspace yet, the check reports the fact as a finding
 * only if the package IS present but holds no ingress module: an absent package
 * is named by `absentPackages` and the check widens by itself when it arrives.
 */
export function checkIngressFramesOutsideText(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const facts = loadLayerFacts(root);
  const findings: Finding[] = [];
  const directory = directoryOf(facts.ingressPackage, root);
  if (directory === undefined) return Object.freeze(findings);
  const files = sourcesOf(directory);
  const ingress = files.filter((f) => /ingress|boundar|redact/i.test(f));
  if (ingress.length === 0) {
    findings.push(
      finding(
        rel(directory, root),
        0,
        `${facts.ingressPackage} is the ingress package of the graph and holds no ingress ` +
          `module: outside text must be wrapped in random boundaries per call ` +
          `(F100-FR-221, F100-FR-009)`,
        facts.ingressPackage,
      ),
    );
    return Object.freeze(findings);
  }
  const wraps = ingress.some((file) => {
    const text = linesOf(file).join("\n");
    return BOUNDARY_MARKS.some((mark) => new RegExp(mark, "i").test(text));
  });
  if (!wraps) {
    findings.push(
      finding(
        rel(ingress[0], root),
        0,
        "the ingress wraps outside text in random boundaries per call (F100-FR-221)",
        "boundary",
      ),
    );
  }
  for (const file of ingress) {
    for (const [index, line] of linesOf(file).entries()) {
      const code = line.replace(/\/\/.*$/, "");
      if (!PARSE_MARKS.some((mark) => code.includes(mark))) continue;
      if (!/outside|untrusted|foreign|comment|feedback|evidence/i.test(code)) continue;
      findings.push(
        finding(
          rel(file, root),
          index + 1,
          "the ingress parses outside text for a control record; outside text is data " +
            "(F100-FR-221)",
          code.trim(),
        ),
      );
    }
  }
  return Object.freeze(findings);
}

/** Both checks of T287, as one list of findings. */
export function checkNoListenerAndIngress(options: CheckOptions = {}): readonly Finding[] {
  return Object.freeze([...checkNoListener(options), ...checkIngressFramesOutsideText(options)]);
}

/** The check the runner of T264 registers. */
export const noListenerCheck: StaticCheck = {
  name: "No listener",
  covers: ["F100-FR-220", "F100-FR-221", "F100-FR-225"],
  run: checkNoListenerAndIngress,
};

export default noListenerCheck;
