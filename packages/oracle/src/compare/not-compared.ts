/**
 * The members of a launch contract that the divergence register says are **not
 * compared**, dropped from both captures before the comparator reads them
 * (F141-FR-021, F141-FR-023; register rows DV-061 and DV-097).
 *
 * Two rows of `docs/ecosystem/consolidation.md` section 6 handle a member of the
 * launch contract by taking it out of the comparison rather than by mapping it:
 *
 * | Row | Register text | Members |
 * |---|---|---|
 * | DV-061 | "Not carried … Not compared. Each is `dropped` with a written justification" | the five configuration keys of the baseline that no component reads (R19 D-12) |
 * | DV-097 | "Not compared; own tests" | `configuration.comment` and `configuration.verification`, which only the product writes (F107-FR-034, F107-FR-036) |
 *
 * Why this module has to exist. Without it a CONFORMANT port reads `different` on
 * the surface `tree` of FX-32 for two reasons that the register has already ruled
 * are no divergence of behaviour: the baseline writes five configuration keys that
 * F107-FR-024 forbids the product to write, and the product writes a verification
 * mode and a comment hash that the baseline has no notion of. `register-map.json`
 * carries both rows with the handling `no differential test` and, until this
 * module, nothing in the comparison acted on them — so a conformant port would have
 * been reported `different` for two members the register had already ruled out of
 * the comparison.
 *
 * It is NOT a normalization rule: the rules N-01 to N-29 are feature 100's data and
 * are counted per rule (F141-FR-020). This is the handling of two register rows,
 * like the key-name map beside it, and is reported apart (`Comparison.notCompared`).
 *
 * Scope: a launch contract and nothing else, through `isALaunchContract`. A member
 * that is not there is not an error — a draft of the port holds no `comment` unless
 * one was given — and nothing outside the listed paths is ever removed.
 */
import { isALaunchContract, renderLaunchContract, type CaptureLike } from "./key-names.ts";

/** One member that is not compared: where it is, whose it is, and why it is dropped. */
export type NotComparedMember = {
  /** The row of the divergence register that rules it. */
  readonly row: string;
  /** The dotted path of the member inside the launch contract. */
  readonly path: string;
  /** The side whose capture carries it; `both` where either side may. */
  readonly side: "reference" | "port" | "both";
  /** The written justification the register asks for. */
  readonly justification: string;
};

/** The five configuration keys of the baseline that no component reads (R19 D-12). */
export const FIVE_KEYS_WITH_NO_READER: readonly string[] = Object.freeze([
  "configuration.agent_stream",
  "configuration.color",
  "configuration.live_detail",
  "configuration.specstride_live",
  "configuration.telemetry",
]);

/** Every member of a launch contract that the register takes out of the comparison. */
export const NOT_COMPARED_MEMBERS: readonly NotComparedMember[] = Object.freeze([
  ...FIVE_KEYS_WITH_NO_READER.map((path) =>
    Object.freeze({
      row: "DV-061",
      path,
      side: "both" as const,
      justification:
        "a configuration key the baseline writes and no component of either system reads " +
        "(R19 D-12, decision 16); not carried by the product (F107-FR-024) and not compared",
    }),
  ),
  Object.freeze({
    row: "DV-097",
    path: "configuration.verification",
    side: "port" as const,
    justification:
      "the verification mode the product states and records (F107-FR-036); the baseline has " +
      "no notion of it, so the register compares it by the product's own tests and not here",
  }),
  Object.freeze({
    row: "DV-097",
    path: "configuration.comment",
    side: "port" as const,
    justification:
      "the hash of the comment and what changed (F107-FR-034); the baseline has no notion of " +
      "it, so the register compares it by the product's own tests and not here",
  }),
]);

/** The rows of the register this dropping is the handling of. */
export const NOT_COMPARED_ROWS: readonly string[] = Object.freeze([
  ...new Set(NOT_COMPARED_MEMBERS.map((member) => member.row)),
]);

/** How many members one dropping removed, and the rows it is the handling of. */
export type NotComparedDrop = {
  readonly dropped: number;
  readonly rows: readonly string[];
};

/** The members that apply to one side: its own, and those of both sides. */
export function membersOfSide(side: "reference" | "port"): readonly NotComparedMember[] {
  return NOT_COMPARED_MEMBERS.filter((member) => member.side === side || member.side === "both");
}

/**
 * One launch contract without the members that are not compared. The holder of a
 * dropped member is copied before it is changed, so the capture handed in is never
 * modified in place.
 */
export function dropNotComparedMembers(
  contract: Readonly<Record<string, unknown>>,
  side: "reference" | "port",
): { readonly value: Record<string, unknown>; readonly dropped: number } {
  let dropped = 0;
  const value: Record<string, unknown> = { ...contract };
  const copied = new Map<string, Record<string, unknown>>([["", value]]);
  for (const member of membersOfSide(side)) {
    const steps = member.path.split(".");
    let at = "";
    let holder: Record<string, unknown> | undefined = value;
    for (const step of steps.slice(0, -1)) {
      const key = at === "" ? step : `${at}.${step}`;
      const known = copied.get(key);
      if (known !== undefined) {
        holder = known;
        at = key;
        continue;
      }
      const next: unknown = (holder as Record<string, unknown>)[step];
      if (next === null || typeof next !== "object" || Array.isArray(next)) {
        holder = undefined;
        break;
      }
      const copy: Record<string, unknown> = { ...(next as Record<string, unknown>) };
      (holder as Record<string, unknown>)[step] = copy;
      copied.set(key, copy);
      holder = copy;
      at = key;
    }
    if (holder === undefined) continue;
    const leaf = steps[steps.length - 1] as string;
    if (!(leaf in holder)) continue;
    delete holder[leaf];
    dropped += 1;
  }
  return { value, dropped };
}

/**
 * The capture of one side with every launch contract it holds stripped of the
 * members the register does not compare — as a parsed record of a surface, and as
 * the TEXT of a captured file, which is how a draft written with `--output`
 * reaches a capture.
 */
export function applyNotCompared<T extends CaptureLike>(
  capture: T,
): { readonly capture: T; readonly drop: NotComparedDrop } {
  const side = capture.side;
  let dropped = 0;
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      if (!value.includes('"generated_by"')) return value;
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        return value;
      }
      if (!isALaunchContract(parsed)) return value;
      const stripped = dropNotComparedMembers(parsed as Record<string, unknown>, side);
      if (stripped.dropped === 0) return value;
      dropped += stripped.dropped;
      return renderLaunchContract(stripped.value);
    }
    if (Array.isArray(value)) return value.map(walk);
    if (value === null || typeof value !== "object") return value;
    if (isALaunchContract(value)) {
      const stripped = dropNotComparedMembers(value as Record<string, unknown>, side);
      dropped += stripped.dropped;
      return stripped.value;
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
    drop: {
      dropped,
      rows: dropped === 0 ? Object.freeze([]) : NOT_COMPARED_ROWS,
    },
  };
}
