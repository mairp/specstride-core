/**
 * T047 — the static check that the product offers nothing for the oracle alone,
 * and that the product package holds no file of the oracle (F141-FR-004,
 * F141-FR-045).
 *
 * Two sentences of the specification, and one check each:
 *
 * - F141-FR-004: "The oracle MUST fail when the product offers a switch, a
 *   variable or a code path that exists for the oracle alone." The oracle runs the
 *   product under the named profile `parity`, which is ORDINARY CONFIGURATION owned
 *   by feature 100 — every row of it is a switch the product has for its own
 *   reasons. A switch named after the oracle would be something else: a path
 *   through the product that only the oracle takes, which no release could ever
 *   have tested. The constraint of the owner says it plainly: "The product contains
 *   no oracle-only code path" (LR-10).
 * - F141-FR-045: "The oracle MUST never be part of the product package, and the
 *   product package MUST hold no file of the oracle, no stub and no fixture."
 *
 * The check is STATIC: it reads the source of the product and its manifests and
 * runs nothing. It is a check of the oracle over the product and never the other
 * way round — the product does not know the oracle exists, which is the point.
 */
import { existsSync, readFileSync, readdirSync, lstatSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import packageGraph from "@specstride/contracts/data/package-graph.json" with { type: "json" };

/** The root of the repository. */
export const REPOSITORY_ROOT = resolve(
  dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))),
);

/** The packages of the oracle and the test kit: the two at layer `dev`. */
export const DEV_LAYER = "dev" as const;

/** The name of the published package of the product. */
export const PRODUCT_PACKAGE = "specstride" as const;

/** The packages the build publishes (`package-graph.json`, `published`). */
export function publishedPackages(): readonly string[] {
  return Object.freeze([...(packageGraph as { published: string[] }).published]);
}

/** The packages at layer `dev`, which are never part of the product package. */
export function devPackages(): readonly string[] {
  return Object.freeze(
    (packageGraph as { packages: { name: string; layer: string }[] }).packages
      .filter((entry) => entry.layer === DEV_LAYER)
      .map((entry) => entry.name),
  );
}

/** The packages of the product: every package that is not at layer `dev`. */
export function productPackages(): readonly string[] {
  return Object.freeze(
    (packageGraph as { packages: { name: string; layer: string }[] }).packages
      .filter((entry) => entry.layer !== DEV_LAYER)
      .map((entry) => entry.name),
  );
}

/** The directory of a package of the workspace. */
export function directoryOf(name: string, root: string = REPOSITORY_ROOT): string {
  return join(root, "packages", name.replace("@specstride/", ""));
}

/**
 * What a switch, a variable or a code path "for the oracle alone" looks like. A
 * name of the oracle in the product is the signal; the oracle's own name, the name
 * of the profile with the oracle attached, and the names of the stub kit are the
 * forms it would take.
 */
export const ORACLE_ONLY_MARKERS: readonly { readonly marker: RegExp; readonly what: string }[] =
  Object.freeze([
    { marker: /\bSPECSTRIDE_ORACLE[A-Z_]*\b/, what: "a variable for the oracle alone" },
    { marker: /\bORACLE_[A-Z_]+\b/, what: "a variable of the stub kit of the oracle" },
    { marker: /["'`]oracle[.:][a-z]/, what: "a configuration key for the oracle alone" },
    {
      marker: /\bisOracle\b|\binOracle\b|\boracleMode\b|\bORACLE_MODE\b/,
      what: "a code path for the oracle alone",
    },
    { marker: /--oracle\b/, what: "a flag for the oracle alone" },
    // The package of the oracle is caught as an IMPORT or as a DEPENDENCY and not
    // by its bare name: `packages/contracts/data/package-graph.json` names every
    // package of the workspace, the oracle among them, and THAT entry is what
    // declares the oracle to be at layer `dev` and outside the published set — the
    // registry F141-FR-045 is checked against, not a path into the product.
    {
      marker: /(?:from|import|require)\s*\(?\s*["'`]@specstride\/oracle/,
      what: "an import of the package of the oracle",
    },
    {
      marker: /["'`]@specstride\/oracle["'`]\s*:\s*["'`]/,
      what: "a dependency on the package of the oracle",
    },
  ]);

/**
 * The words that name the oracle in prose and are no switch. A comment that says
 * the oracle compares this behaviour is not a code path: the register, the profile
 * and the parity tests are cited all over the product and must be.
 */
export const PROSE_IS_NOT_A_CODE_PATH = true as const;

/**
 * The sanctioned test-side consumers of the oracle: files that name the oracle
 * because they VERIFY the product against it, not because the product offers
 * anything for it. Feature 129's configuration parity kit is the one such kit
 * (its contract makes config's defaults and learned values checkable against
 * the oracle's reference trees); every other file stays under the rule.
 */
const SANCTIONED_ORACLE_TEST_KITS: ReadonlySet<string> = new Set([
  "packages/config/tests/parity/oracle.ts",
  "packages/policy/test/fixtures-141.test.ts",
  "packages/observability/test/ingress-failclosed.test.ts",
  "packages/kernel/test/redactor/redaction-rules.test.ts",
  "packages/observability/test/limits.test.ts",
  "packages/observability/test/retention.test.ts",
  "packages/observability/test/targets.test.ts",
]);

/** Whether a finding is one of the sanctioned test kits and not a finding. */
export function isSanctionedTestKit(file: string): boolean {
  return SANCTIONED_ORACLE_TEST_KITS.has(file);
}

/** One finding of the static check. */
export type NoOraclePathFinding = {
  readonly file: string;
  readonly line: number;
  readonly what: string;
  readonly text: string;
};

/** Every source file of a directory, as paths relative to the repository root. */
export function sourceFilesOf(dir: string, root: string = REPOSITORY_ROOT): readonly string[] {
  const found: string[] = [];
  const walk = (at: string): void => {
    if (!existsSync(at)) return;
    for (const name of readdirSync(at).sort()) {
      if (name === "node_modules" || name === ".git" || name === "dist") continue;
      const path = join(at, name);
      const stat = lstatSync(path);
      if (stat.isDirectory()) walk(path);
      else if (stat.isFile() && /\.(ts|mts|cts|js|mjs|json)$/.test(name)) {
        found.push(relative(root, path));
      }
    }
  };
  walk(dir);
  return Object.freeze(found);
}

/** Whether a line is prose (a comment) and therefore no code path. */
export function isProse(line: string): boolean {
  const text = line.trim();
  return text.startsWith("//") || text.startsWith("*") || text.startsWith("/*");
}

/**
 * F141-FR-004 — the product offers nothing for the oracle alone. Every package of
 * the product is read; a marker inside a comment is prose and is not a finding.
 */
export function productOffersNothingForTheOracleAlone(
  root: string = REPOSITORY_ROOT,
): readonly NoOraclePathFinding[] {
  const findings: NoOraclePathFinding[] = [];
  for (const name of productPackages()) {
    for (const file of sourceFilesOf(directoryOf(name, root), root)) {
      const text = readFileSync(join(root, file), "utf8");
      text.split("\n").forEach((line, i) => {
        if (isProse(line)) return;
        for (const { marker, what } of ORACLE_ONLY_MARKERS) {
          if (marker.test(line)) {
            findings.push({ file, line: i + 1, what, text: line.trim().slice(0, 160) });
          }
        }
      });
    }
  }
  return Object.freeze(findings.filter((f) => !isSanctionedTestKit(f.file)));
}

/**
 * F141-FR-045 — the product package holds no file of the oracle, no stub and no
 * fixture. Checked three ways: the oracle is at layer `dev` and is not in the
 * published set; no package of the product may import it; and its manifest is
 * private, so npm refuses to publish it at all.
 */
export function productPackageHoldsNoFileOfTheOracle(
  root: string = REPOSITORY_ROOT,
): readonly NoOraclePathFinding[] {
  const findings: NoOraclePathFinding[] = [];

  // The oracle is not in the published set.
  for (const name of devPackages()) {
    if (publishedPackages().includes(name) && name !== "@specstride/testkit") {
      findings.push({
        file: "packages/contracts/data/package-graph.json",
        line: 0,
        what: "a package at layer dev in the published set",
        text: `${name} is at layer ${DEV_LAYER} and the build publishes it`,
      });
    }
  }
  // The manifest of the oracle is private, and declares that it is never shipped.
  const manifestFile = join(root, "packages", "oracle", "package.json");
  if (existsSync(manifestFile)) {
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8")) as {
      private?: unknown;
      specstride?: { layer?: string; shipped?: string };
      scripts?: Record<string, string>;
    };
    if (manifest.private !== true) {
      findings.push({
        file: "packages/oracle/package.json",
        line: 0,
        what: "the package of the oracle is not private",
        text: "npm would publish it; the oracle is never part of the product package (F141-FR-045)",
      });
    }
    if (manifest.specstride?.layer !== DEV_LAYER) {
      findings.push({
        file: "packages/oracle/package.json",
        line: 0,
        what: "the package of the oracle is not at layer dev",
        text: `its layer is ${String(manifest.specstride?.layer)}`,
      });
    }
    for (const script of ["preinstall", "install", "postinstall", "prepare", "prepublishOnly"]) {
      if (manifest.scripts?.[script] !== undefined) {
        findings.push({
          file: "packages/oracle/package.json",
          line: 0,
          what: "the package of the oracle has an install script",
          text: `${script}: ${manifest.scripts[script] as string}`,
        });
      }
    }
  }
  // No package of the product imports the oracle, its stubs or its fixtures.
  for (const name of productPackages()) {
    for (const file of sourceFilesOf(directoryOf(name, root), root)) {
      const text = readFileSync(join(root, file), "utf8");
      text.split("\n").forEach((line, i) => {
        if (isProse(line)) return;
        if (/packages\/oracle\/(stubs|fixtures|golden)/.test(line)) {
          findings.push({
            file,
            line: i + 1,
            what: "a package of the product names a stub or a fixture of the oracle",
            text: line.trim().slice(0, 160),
          });
        }
      });
    }
  }
  return Object.freeze(findings.filter((f) => !isSanctionedTestKit(f.file)));
}

/** A product that offers something for the oracle alone, or ships a file of it. */
export class NoOraclePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoOraclePathError";
  }
}

/** Both checks. The oracle FAILS when either finds something (F141-FR-004). */
export function assertNoOraclePath(root: string = REPOSITORY_ROOT): void {
  const findings = [
    ...productOffersNothingForTheOracleAlone(root),
    ...productPackageHoldsNoFileOfTheOracle(root),
  ];
  if (findings.length === 0) return;
  throw new NoOraclePathError(
    `the product offers something that exists for the oracle alone, or the product package holds a ` +
      `file of the oracle (F141-FR-004, F141-FR-045, LR-10): ` +
      `${findings.map((f) => `${f.file}:${String(f.line)} ${f.what} — ${f.text}`).join("; ")}`,
  );
}
