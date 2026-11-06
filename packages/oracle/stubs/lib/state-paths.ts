/**
 * T039, T046 — where the argument `state` of the proposer verb `write`
 * resolves to (F141-FR-007, F141-FR-012).
 *
 * A script holds the LOGICAL name of a file of state and never a path
 * (§O.3, rule 5). The path differs per side: the as-is path on the reference,
 * and on the port the path the layout tables of feature 100 give that name. So
 * the driver of a side resolves every logical name once, writes the map into
 * the run root, and names the file in `ORACLE_STATE_PATHS`. The stub reads the
 * map and never resolves a path itself — which is what makes "the same stub,
 * unchanged, serves the reference and the port" (§O.3, rule 3) true for the
 * one verb that writes state.
 */
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute } from "node:path";

/** The variable through which a stub finds the map of its side. */
export const STATE_PATH_VARIABLE = "ORACLE_STATE_PATHS" as const;

/** A logical name the map does not hold, or a map that is not one. */
export class StatePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StatePathError";
  }
}

/** The map of one side: logical name of a file of state, to the path on that side. */
export type StatePathMap = Readonly<Record<string, string>>;

/** Read the map of the side the stub runs on. */
export function readStatePathMap(file: string): StatePathMap {
  if (!existsSync(file)) {
    throw new StatePathError(
      `${file}: the driver of the side writes the map of the files of state before the run ` +
        `(F141-FR-012)`,
    );
  }
  const parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new StatePathError(`${file}: the map of the files of state is an object`);
  }
  const map: Record<string, string> = {};
  for (const [name, path] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof path !== "string" || !isAbsolute(path)) {
      throw new StatePathError(`${file}: the logical name ${name} resolves to no absolute path`);
    }
    map[name] = path;
  }
  return Object.freeze(map);
}

/**
 * The path the logical name resolves to on this side. A name the map does not
 * hold fails the call: a stub never guesses a path.
 */
export function resolveStateFile(logicalName: string, map: StatePathMap): string {
  const path = map[logicalName];
  if (path === undefined) {
    throw new StatePathError(
      `the logical name ${JSON.stringify(logicalName)} is no file of state of this scenario; the ` +
        `driver of the side laid out ${Object.keys(map).length} of them ` +
        `(${Object.keys(map).sort().join(", ")})`,
    );
  }
  return path;
}
