/**
 * The key-name map of the launch contract, applied where the launch contract is
 * compared (F141-FR-021, F141-FR-023; register rows DV-055 and DV-120, both
 * handled as **mapped**).
 *
 * Two members of the launch contract are named differently on the two sides, on
 * purpose, and the register says how the oracle handles it:
 *
 * | Row | Register text | Pair |
 * |---|---|---|
 * | DV-055 | "Mapped: mode map; key name map in the launch contract comparison" | `configuration.auto` → `configuration.relaunch` |
 * | DV-120 | "Mapped: the key-name map of the launch contract (annex X §X.8) gains the pair `schema_version` and `schema` with their two values" | `schema_version` → `schema` |
 *
 * The pairs themselves are DATA of feature 100 — `launchContractKeyMap` of
 * `normalization.json`, read through `register/register-map.ts` — and this module
 * holds no pair of its own. What it adds is the one thing the map cannot carry,
 * because the map is a map of NAMES: the pair of VALUES that DV-120 names in the
 * same breath ("with their two values"), the as-is `"1.0"` against the product's
 * schema id. That pair is `SCHEMA_VALUE_PAIR` below, with the row that rules it.
 *
 * Direction: the PORT's capture is mapped onto the as-is names, never the other
 * way round, so a golden capture of the reference stays exactly as it was taken.
 *
 * Scope: a launch contract and nothing else. `isALaunchContract` asks for the
 * members that only a launch contract has together (`generated_by`, `coverage`,
 * `features`, `status`), so no other record of a capture can be touched by it. A
 * capture of the reference side is returned unchanged.
 */
import { theLaunchContractKeyMap } from "../register/register-map.ts";

/** A capture, as the comparator takes it. */
export type CaptureLike = {
  readonly side: "reference" | "port";
  readonly surfaces: Readonly<Record<string, unknown>>;
};

/**
 * The two values of the field DV-120 renames: the as-is `schema_version` carries
 * `"1.0"`, the product's `schema` carries the schema id of the launch contract.
 */
export const SCHEMA_VALUE_PAIR = Object.freeze({
  row: "DV-120",
  asIsKey: "schema_version",
  asIsValue: "1.0",
  portValue: "specstride.launch-contract/1",
});

/** The rows of the register that this mapping is the handling of. */
export const MAPPED_ROWS: readonly string[] = Object.freeze(["DV-055", "DV-120"]);

/** The members a launch contract has together, and no other record of a capture has. */
export const LAUNCH_CONTRACT_MEMBERS: readonly string[] = Object.freeze([
  "generated_by",
  "coverage",
  "features",
  "status",
]);

/** Whether a value is a launch contract: every member of the set above is present. */
export function isALaunchContract(value: unknown): boolean {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (!LAUNCH_CONTRACT_MEMBERS.every((member) => member in record)) return false;
  return "schema" in record || "schema_version" in record;
}

/** How many names and values one mapping replaced, and the rows it is the handling of. */
export type KeyNameMapping = {
  readonly replaced: number;
  readonly rows: readonly string[];
};

/**
 * One launch contract of the port, with the as-is names of the key-name map in
 * place of the product's. The pairs are read from the data of feature 100 in the
 * order they stand there; a dotted pair names a member of a member.
 */
export function mapLaunchContractKeys(contract: Readonly<Record<string, unknown>>): {
  readonly value: Record<string, unknown>;
  readonly replaced: number;
} {
  let replaced = 0;
  const mapped: Record<string, unknown> = { ...contract };
  // Each level of a dotted path is copied ONCE and then shared, so two pairs that
  // name members of the same holder (`configuration.auto`, `configuration.relaunch`)
  // act on one object and not on two copies of it.
  const copied = new Map<string, Record<string, unknown>>([["", mapped]]);
  const holderOf = (
    path: readonly string[],
    create: boolean,
  ): Record<string, unknown> | undefined => {
    let at = "";
    let holder = mapped;
    for (const step of path) {
      const key = at === "" ? step : `${at}.${step}`;
      const known = copied.get(key);
      if (known !== undefined) {
        holder = known;
        at = key;
        continue;
      }
      const next = holder[step];
      if (next === null || typeof next !== "object" || Array.isArray(next)) {
        if (!create) return undefined;
        holder[step] = {};
      } else {
        holder[step] = { ...(next as Record<string, unknown>) };
      }
      holder = holder[step] as Record<string, unknown>;
      copied.set(key, holder);
      at = key;
    }
    return holder;
  };
  for (const [asIs, ofThePort] of Object.entries(theLaunchContractKeyMap())) {
    const asIsPath = asIs.split(".");
    const portPath = ofThePort.split(".");
    const holder = holderOf(portPath.slice(0, -1), false);
    const portLeaf = portPath[portPath.length - 1] as string;
    if (holder === undefined || !(portLeaf in holder)) continue;
    const asIsHolder = holderOf(asIsPath.slice(0, -1), true) as Record<string, unknown>;
    const asIsLeaf = asIsPath[asIsPath.length - 1] as string;
    let value = holder[portLeaf];
    // DV-120 names the pair of values beside the pair of names.
    if (asIsLeaf === SCHEMA_VALUE_PAIR.asIsKey && value === SCHEMA_VALUE_PAIR.portValue) {
      value = SCHEMA_VALUE_PAIR.asIsValue;
    }
    delete holder[portLeaf];
    asIsHolder[asIsLeaf] = value;
    replaced += 1;
  }
  return { value: mapped, replaced };
}

/** The text of a launch contract, as both sides write it: sorted keys, indent two, a final line end. */
export function renderLaunchContract(contract: Readonly<Record<string, unknown>>): string {
  return `${JSON.stringify(sortKeys(contract), null, 2)}\n`;
}

/** Every object of a value, with its members in order of their names. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    out[key] = sortKeys((value as Record<string, unknown>)[key]);
  }
  return out;
}

/**
 * The capture of the PORT with the key-name map of the launch contract applied to
 * every launch contract it holds — as a parsed record of a surface, and as the
 * TEXT of a captured file, which is how a draft written with `--output` reaches a
 * capture. A capture of the reference is returned as it is.
 */
export function applyLaunchContractKeyMap<T extends CaptureLike>(
  capture: T,
): { readonly capture: T; readonly mapping: KeyNameMapping } {
  if (capture.side !== "port") {
    return { capture, mapping: { replaced: 0, rows: Object.freeze([]) } };
  }
  let replaced = 0;
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      // The body of a captured file: a launch contract written to disk.
      if (!value.includes('"generated_by"')) return value;
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        return value;
      }
      if (!isALaunchContract(parsed)) return value;
      const mapped = mapLaunchContractKeys(parsed as Record<string, unknown>);
      if (mapped.replaced === 0) return value;
      replaced += mapped.replaced;
      return renderLaunchContract(mapped.value);
    }
    if (Array.isArray(value)) return value.map(walk);
    if (value === null || typeof value !== "object") return value;
    if (isALaunchContract(value)) {
      const mapped = mapLaunchContractKeys(value as Record<string, unknown>);
      replaced += mapped.replaced;
      return mapped.value;
    }
    const out: Record<string, unknown> = {};
    for (const [key, member] of Object.entries(value as Record<string, unknown>)) {
      out[key] = walk(member);
    }
    return out;
  };
  const surfaces: Record<string, unknown> = {};
  for (const [surface, value] of Object.entries(capture.surfaces)) surfaces[surface] = walk(value);
  return {
    capture: Object.freeze({ ...capture, surfaces: Object.freeze(surfaces) }) as T,
    mapping: {
      replaced,
      rows: replaced === 0 ? Object.freeze([]) : MAPPED_ROWS,
    },
  };
}
