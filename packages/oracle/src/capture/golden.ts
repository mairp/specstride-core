/**
 * The committed golden captures (T051, T062; F141-FR-025 in part).
 *
 * Decision D-1 of `research.md` is a hybrid: a change under review is compared
 * against a COMMITTED normalized capture of the reference, and the live
 * differential run on Linux is the release condition. This module is the
 * committed half that the scenarios of this phase need — the normalized capture
 * of one side of one scenario, on disk under `packages/oracle/golden/`, and the
 * comparison of a fresh capture with it.
 *
 * The capture job that refreshes every golden capture and FAILS when a committed
 * one differs from a fresh one is F141-FR-026 and belongs to the phase that builds
 * the tiers; what is here is the file layout, the writer, the reader and the
 * comparison, so that a golden capture is never a hand-written file.
 *
 * A golden capture holds the NORMALIZED surfaces and the count of every rule: the
 * values a comparison reads. It holds no absolute path, no time, no nonce and no
 * process id, because the rules of feature 100 have already replaced them — which
 * is what makes it committable at all.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { ORACLE_ROOT } from "../index.ts";
import { differencesOf } from "../compare/comparator.ts";
import type { Difference } from "../waivers/waivers.ts";
import type { NormalizedCapture } from "../normalize/index.ts";

/** Where the golden captures live. */
export const GOLDEN_DIR = join(ORACLE_ROOT, "golden");

/** The schema id of a golden capture; the oracle's own, never a contract of the product. */
export const GOLDEN_SCHEMA_ID = "urn:specstride:schema:internal:141:oracle-golden/1" as const;

/** A golden capture as it lies on disk. */
export type GoldenCapture = {
  readonly schema: typeof GOLDEN_SCHEMA_ID;
  /** The scenario, as `FX-nn/<name>`. */
  readonly fixture: string;
  readonly side: "reference" | "port";
  readonly suite: "first" | "second";
  readonly layer: "off" | "on";
  /** The system of the baseline and the commit it was captured at. */
  readonly system: string;
  readonly commit: string;
  readonly surfaces: Readonly<Record<string, unknown>>;
  readonly missing: Readonly<Record<string, string>>;
  readonly counts: Readonly<Record<string, number>>;
};

/**
 * The name one scenario is captured, stored and waived under.
 *
 * For every family but FX-35 and FX-36 that is the `id` of the declaration. Those
 * two have VARIANTS, and `data-model.md` makes the variant part of the identity of
 * a scenario: "`FX-nn/<name>`, with the variant for FX-35 and FX-36". F141-FR-016
 * is why — the same scenario runs twice, against the engine stub and against the
 * real engine, and the two runs leave two different captures. The schema of
 * `fixture.json` keeps the two apart (`id` and `variant`) because the id of a
 * scenario is kebab-case; the STORE needs one name, so it is the two joined, which
 * is also the form `parseCitation` of the catalogue and the waiver file accept
 * (`FX-35/dry-run@engine-stub`).
 */
export function scenarioNameOf(declaration: {
  readonly id: string;
  readonly variant?: string | undefined;
}): string {
  return declaration.variant === undefined || declaration.variant === ""
    ? declaration.id
    : `${declaration.id}${declaration.variant}`;
}

/** The file one golden capture lies in: `golden/FX-nn/<name>.<side>.json`. */
export function goldenFile(fixture: string, side: "reference" | "port" = "reference"): string {
  const [family, name] = fixture.split("/");
  return join(GOLDEN_DIR, family as string, `${name as string}.${side}.json`);
}

/** Whether a golden capture is committed for one scenario. */
export function hasGoldenCapture(
  fixture: string,
  side: "reference" | "port" = "reference",
): boolean {
  return existsSync(goldenFile(fixture, side));
}

/** The golden capture of one scenario, read off disk. */
export function readGoldenCapture(
  fixture: string,
  side: "reference" | "port" = "reference",
): GoldenCapture {
  const file = goldenFile(fixture, side);
  const parsed = JSON.parse(readFileSync(file, "utf8")) as GoldenCapture;
  if (parsed.schema !== GOLDEN_SCHEMA_ID) {
    throw new Error(`${file}: the golden capture names the schema ${String(parsed.schema)}`);
  }
  if (parsed.fixture !== fixture || parsed.side !== side) {
    throw new Error(
      `${file}: the golden capture is of ${parsed.fixture} (${parsed.side}) and was asked for as ` +
        `${fixture} (${side})`,
    );
  }
  return parsed;
}

/** Write the golden capture of one scenario from a normalized capture. */
export function writeGoldenCapture(
  normalized: NormalizedCapture,
  about: { readonly fixture: string; readonly system: string; readonly commit: string },
): string {
  const golden: GoldenCapture = {
    schema: GOLDEN_SCHEMA_ID,
    fixture: about.fixture,
    side: normalized.side,
    suite: normalized.suite,
    layer: normalized.layer,
    system: about.system,
    commit: about.commit,
    surfaces: normalized.surfaces,
    missing: normalized.missing,
    counts: normalized.counts,
  };
  const file = goldenFile(about.fixture, normalized.side);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(golden, null, 1)}\n`, "utf8");
  return file;
}

/**
 * The differences between a fresh normalized capture and the committed golden
 * capture, surface by surface. An empty list is what a change under review needs;
 * anything else is either a regression of the port or a golden capture that must be
 * captured again (F141-FR-026).
 */
export function differencesFromGolden(
  fresh: NormalizedCapture,
  golden: GoldenCapture,
): readonly Difference[] {
  const names = [
    ...new Set([...Object.keys(golden.surfaces), ...Object.keys(fresh.surfaces)]),
  ].sort();
  return Object.freeze(
    names.flatMap((surface) =>
      differencesOf(golden.fixture, surface, golden.surfaces[surface], fresh.surfaces[surface]),
    ),
  );
}
