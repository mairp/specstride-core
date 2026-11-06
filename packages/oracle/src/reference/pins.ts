/**
 * T007 — the pins of the reference systems and their reader (F141-FR-001).
 *
 * The oracle holds one pin per reference system: the full commit id and the
 * tree hash of that commit. Only the pinned commit counts. The branch a source
 * repository has checked out and any uncommitted change in it have no effect on
 * the reference, and the reader is what makes that true: it reads
 * `packages/oracle/reference/pins.json` and nothing else — no clone, no
 * variable of the environment, no git command, no working directory. A pin has
 * exactly the three fields `system`, `commit` and `tree`, so there is nothing
 * in a pin that a checkout could change.
 *
 * Lisa has no pin and no reference run: `pin("lisa")` is `undefined`,
 * `requirePin("lisa")` throws, and `pins.json` records in `noPin` why.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** `packages/oracle/reference/pins.json`. */
export const PINS_FILE = join(
  resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url))))),
  "reference/pins.json",
);

/** The schema id the pins file carries. */
export const PINS_SCHEMA_ID = "urn:specstride:schema:internal:141:oracle-pins/1" as const;

/** A commit id and a tree hash are 40 hex. */
export const PIN_HASH_PATTERN = /^[0-9a-f]{40}$/;

/** The two reference systems of F141-FR-001, in the order of the file. */
export const PINNED_SYSTEMS = ["specstride", "mixture-of-loops"] as const;

export type PinnedSystem = (typeof PINNED_SYSTEMS)[number];

/** The third system of the consolidation, which is no reference. */
export const LISA = "lisa" as const;

/** Every system of the consolidation that has no pin and no reference run. */
export const SYSTEMS_WITHOUT_A_PIN = [LISA] as const;

/** The three fields of a pin, and no other (F141-FR-001). */
export const PIN_FIELDS = ["system", "commit", "tree"] as const;

/** One pin: the system, the full commit id and the tree hash of that commit. */
export type Pin = {
  readonly system: string;
  readonly commit: string;
  readonly tree: string;
};

/** A pins file, or a pin, that does not hold up. */
export class PinError extends Error {
  constructor(message: string) {
    super(`packages/oracle/reference/pins.json: ${message}`);
    this.name = "PinError";
  }
}

type RawPinsFile = {
  schema?: unknown;
  pins?: unknown;
  noPin?: unknown;
};

/**
 * Read and check the pins. With no argument the file at `PINS_FILE` is read;
 * with a value, that value is checked instead, which is how the test drives
 * the refusals. Throws `PinError` on anything that is not exactly the two
 * systems with a 40-hex commit and a 40-hex tree.
 */
export function readPins(value?: unknown): readonly Pin[] {
  const data: RawPinsFile =
    value === undefined
      ? (JSON.parse(readFileSync(PINS_FILE, "utf8")) as RawPinsFile)
      : (value as RawPinsFile);

  if (data === null || typeof data !== "object") throw new PinError("is not an object");
  if (data.schema !== PINS_SCHEMA_ID) {
    throw new PinError(`carries schema ${JSON.stringify(data.schema)}, expected ${PINS_SCHEMA_ID}`);
  }
  const raw = data.pins;
  if (!Array.isArray(raw)) throw new PinError("holds no list of pins");
  if (raw.length !== PINNED_SYSTEMS.length) {
    throw new PinError(
      `holds ${String(raw.length)} pins, expected one per reference system (${PINNED_SYSTEMS.join(", ")})`,
    );
  }

  const pins: Pin[] = [];
  for (const entry of raw) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new PinError("a pin is an object");
    }
    const row = entry as Record<string, unknown>;
    const fields = Object.keys(row).sort();
    if (JSON.stringify(fields) !== JSON.stringify([...PIN_FIELDS].sort())) {
      throw new PinError(
        `a pin has the fields ${fields.join(", ")}; a pin has exactly ${[...PIN_FIELDS].sort().join(", ")}, ` +
          `so that nothing a checkout could change is in it (F141-FR-001)`,
      );
    }
    const system = row["system"];
    if (typeof system !== "string" || !(PINNED_SYSTEMS as readonly string[]).includes(system)) {
      throw new PinError(
        `${JSON.stringify(system)} is no reference system; the reference systems are ${PINNED_SYSTEMS.join(" and ")}, ` +
          `and ${SYSTEMS_WITHOUT_A_PIN.join(", ")} has no pin and no reference run`,
      );
    }
    for (const field of ["commit", "tree"] as const) {
      const hash = row[field];
      if (typeof hash !== "string" || !PIN_HASH_PATTERN.test(hash)) {
        throw new PinError(`${system}: the ${field} is ${JSON.stringify(hash)}, expected 40 hex`);
      }
    }
    pins.push(
      Object.freeze({
        system,
        commit: row["commit"] as string,
        tree: row["tree"] as string,
      }),
    );
  }

  const systems = pins.map((p) => p.system);
  if (new Set(systems).size !== systems.length) {
    throw new PinError(`the system ${systems.join(", ")} is pinned twice`);
  }
  for (const system of PINNED_SYSTEMS) {
    if (!systems.includes(system)) throw new PinError(`${system} has no pin`);
  }
  return Object.freeze(pins);
}

/** The two pins, read at import. */
export const pins: readonly Pin[] = readPins();

/** The pin of a system, or `undefined` when the system has none (Lisa). */
export function pin(system: string): Pin | undefined {
  return pins.find((p) => p.system === system);
}

/** Whether a system is a reference system with a pin. */
export function hasPin(system: string): boolean {
  return pin(system) !== undefined;
}

/** The pin of a system, or a refusal that names it. */
export function requirePin(system: string): Pin {
  const found = pin(system);
  if (found === undefined) {
    throw new PinError(
      `${system} has no pin. The reference systems are ${PINNED_SYSTEMS.join(" and ")}; ` +
        `${SYSTEMS_WITHOUT_A_PIN.join(", ")} has no pin and no reference run (F141-FR-001)`,
    );
  }
  return found;
}

/**
 * The pins in the form the exercise map carries them
 * (`data/schemas/exercise-map.schema.json`, field `pins`): the commit that was
 * traced, per system.
 */
export function pinsForExerciseMap(): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(pins.map((p) => [p.system, p.commit])));
}

/**
 * The variable of the job that names the local clone of a system
 * (quickstart.md, "Prerequisites"). The clone may be on any branch and in any
 * state: only the pinned commit is read, and the reader above never touches it.
 */
export const CLONE_VARIABLES: Readonly<Record<string, string>> = Object.freeze({
  specstride: "ORACLE_REF_SPECSTRIDE",
  "mixture-of-loops": "ORACLE_REF_MOL",
});
