/**
 * T096 — the registry of the frame (annex A, §A.4; F100-FR-013 to
 * F100-FR-016).
 *
 * One registry per extension point of
 * `specs/100-specstride/contracts/extension-points/index.json`, filled at
 * process start and read-only after launch. `register(implementation)` checks
 * the class (data is validated against its schema; first-party code is
 * accepted; third-party code is refused in Wave 1 with a message that names
 * the class), checks the declared range of majors against the current major
 * and the one before, applies the widening rule for project configuration
 * through the filter of T248, and `resolved()` gives the records a run writes
 * and replays on resume.
 *
 * The frame is part of the test kit, not of the core: a content owner places
 * the conformance suite and the sample of its point around it, and no core
 * file names either (F100-FR-012, F100-FR-018).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CURRENT_MAJOR,
  EXTENSION_POINT_ID_FORM,
  EXTENSION_POINT_SUB_HEADINGS,
  IMPLEMENTATION_CLASSES,
  CLASSES_ACCEPTED_IN_WAVE_1,
  INTERNAL_SEAM_POINT,
  majorIsSupported,
  majorOutOfRangeMessage,
  parseExtensionPointId,
  standingOf,
  supportedMajors,
  thirdPartyRefusedMessage,
  type ExtensionPointStanding,
  type ImplementationClass,
} from "@specstride/contracts/ep/extension-point";
import { validate } from "@specstride/contracts/records/compile";
import { filterProjectKey } from "@specstride/contracts/envelope/trust-classes";
import type { RankLayer } from "@specstride/contracts/envelope/config";
import { rowOf } from "@specstride/contracts/enums";

export {
  CURRENT_MAJOR,
  EXTENSION_POINT_ID_FORM,
  IMPLEMENTATION_CLASSES,
  supportedMajors,
  majorIsSupported,
  type ImplementationClass,
};

/** The directory of the contract files of the nineteen points. */
export const EXTENSION_POINTS_DIR = "specs/100-specstride/contracts/extension-points" as const;

/** The index of the nineteen points. */
export const EXTENSION_POINTS_INDEX = `${EXTENSION_POINTS_DIR}/index.json` as const;

/**
 * The root the frame reads the corpus at. While the package sits in the
 * repository it is the repository root, five levels up from `src/conformance`
 * (`packages/testkit`, then two more). In a staged or installed tree the
 * fixtures of the published surface ship inside the package at the same
 * relative spelling (the split, phase 3), so there the package root is the
 * root. Behaviour in the repository is unchanged: the corpus is there, so the
 * first candidate wins, and a tree without it reaches the same missing file
 * as before — no branch invents a corpus that is not in the tree.
 */
function resolveRoot(): string {
  const packageRoot = resolve(dirname(dirname(fileURLToPath(import.meta.url))), "..");
  const repositoryRoot = resolve(packageRoot, "../..");
  if (existsSync(join(repositoryRoot, EXTENSION_POINTS_INDEX))) return repositoryRoot;
  if (existsSync(join(packageRoot, EXTENSION_POINTS_INDEX))) return packageRoot;
  return repositoryRoot;
}

/** The root of the repository, or of the package in its staged tree. */
export const ROOT = resolveRoot();

/** The number of extension points of Wave 1 (annex A, §A.4). */
export const EXTENSION_POINT_COUNT = 19 as const;

/** Row 83 of annex X §X.6, the closed set of the three classes. */
export const CLASSES_ROW = 83 as const;

/** The unknown-value cell of row 83: an unknown class is refused at registration. */
export const CLASSES_ROW_UNKNOWN_VALUE =
  rowOf(CLASSES_ROW)?.unknownValue ?? "Refused at registration";

/** One entry of `extension-points/index.json`. */
export type ExtensionPointEntry = {
  /** `EP-01` to `EP-19`. */
  readonly ep: string;
  /** The ids of the point; EP-18 has two. */
  readonly ids: readonly string[];
  readonly annex: string;
  readonly section: string;
  /** The contract file, relative to `contracts/`. */
  readonly file: string;
  readonly operations: readonly string[];
};

type RawEntry = {
  ep: string;
  ids: string[];
  annex: string;
  section: string;
  file: string;
  operations: string[];
};

/** Read the index of the nineteen points (F100-FR-016). */
export function loadExtensionPointIndex(root: string = ROOT): readonly ExtensionPointEntry[] {
  const raw = JSON.parse(readFileSync(join(root, EXTENSION_POINTS_INDEX), "utf8")) as {
    extensionPoints: RawEntry[];
  };
  return Object.freeze(
    raw.extensionPoints.map((e) =>
      Object.freeze({
        ep: e.ep,
        ids: Object.freeze([...e.ids]),
        annex: e.annex,
        section: e.section,
        file: e.file,
        operations: Object.freeze([...e.operations]),
      }),
    ),
  );
}

/** The contract file of one point: the thirteen sub-headings of §A.4 as data. */
export type ExtensionPointContract = {
  readonly ep: string;
  readonly ids: readonly string[];
  readonly annex: string;
  readonly operations: readonly string[];
  readonly requirements: readonly string[];
  readonly sections: Readonly<Record<string, readonly string[]>>;
};

const CONTRACT_CACHE = new Map<string, ExtensionPointContract>();

/** Read the contract file of one point from `extension-points/`. */
export function loadExtensionPointContract(
  ep: string,
  root: string = ROOT,
): ExtensionPointContract {
  const key = `${root}\u0000${ep}`;
  const seen = CONTRACT_CACHE.get(key);
  if (seen !== undefined) return seen;
  const dir = join(root, EXTENSION_POINTS_DIR);
  const name = readdirSync(dir).find((f) => f.startsWith(`${ep}.`));
  if (name === undefined) {
    throw new UnknownExtensionPointError(
      ep,
      loadExtensionPointIndex(root).map((e) => e.ep),
    );
  }
  const raw = JSON.parse(readFileSync(join(dir, name), "utf8")) as ExtensionPointContract;
  const contract = Object.freeze({
    ep: raw.ep,
    ids: Object.freeze([...raw.ids]),
    annex: raw.annex,
    operations: Object.freeze([...raw.operations]),
    requirements: Object.freeze([...raw.requirements]),
    sections: Object.freeze(
      Object.fromEntries(Object.entries(raw.sections).map(([k, v]) => [k, Object.freeze([...v])])),
    ),
  });
  CONTRACT_CACHE.set(key, contract);
  return contract;
}

/** The text of one sub-heading of a point's contract file, as one string. */
export function sectionOf(ep: string, subHeading: string, root: string = ROOT): string {
  const contract = loadExtensionPointContract(ep, root);
  const lines = contract.sections[subHeading];
  if (lines === undefined) {
    throw new Error(
      `the contract file of ${ep} holds no sub-heading "${subHeading}"; §A.4 lists ` +
        `${EXTENSION_POINT_SUB_HEADINGS.join(", ")}`,
    );
  }
  return lines.join(" ");
}

/** A point the index does not hold. */
export class UnknownExtensionPointError extends Error {
  readonly asked: string;
  constructor(asked: string, known: readonly string[]) {
    super(
      `no extension point \`${asked}\`: \`${EXTENSION_POINTS_INDEX}\` holds ` +
        `${known.join(", ")} (annex A, §A.4)`,
    );
    this.name = "UnknownExtensionPointError";
    this.asked = asked;
  }
}

/* ------------------------------------------------------------------ *
 * An implementation of a point.
 * ------------------------------------------------------------------ */

/** One implementation offered to a registry (F100-FR-014). */
export type Implementation = {
  /** `EP-08`. */
  readonly ep: string;
  /** The id of the point the implementation is of, `specstride.event-sink/1`. */
  readonly pointId: string;
  /** The implementation's own id, which the report names. */
  readonly id: string;
  readonly implementationClass: ImplementationClass;
  /** The majors the implementation declares it supports (F100-FR-013). */
  readonly majors: readonly number[];
  /** The rank the registration came from (annex X, §X.2). */
  readonly provenance: RankLayer;
  /** True where the implementation widens capability (F100-FR-015). */
  readonly widensCapability?: boolean;
  /** For the class `data`: the schema id its file is validated against. */
  readonly schemaId?: string;
  /** For the class `data`: the value to validate. */
  readonly value?: unknown;
  /** For code: the operations of the point. */
  readonly operations?: Readonly<Record<string, unknown>>;
  /** The time limit of a call, in milliseconds (F100-FR-019). */
  readonly timeLimitMs?: number;
};

/** The reasons a registration is refused or ignored. */
export const REGISTRATION_REFUSALS = [
  "unknown-point",
  "unknown-class",
  "third-party-class",
  "major-out-of-range",
  "data-invalid",
  "frozen",
  "widening-from-project-configuration",
] as const;
export type RegistrationRefusal = (typeof REGISTRATION_REFUSALS)[number];

/** What `register` did with one implementation. */
export type RegistrationOutcome =
  | { readonly accepted: true; readonly record: ResolvedRecord }
  | {
      readonly accepted: false;
      readonly reason: RegistrationRefusal;
      /** The message the registry gives, and the launch prints. */
      readonly message: string;
      /** The finding the doctor shows, where the rule asks for one. */
      readonly doctorWarning?: string;
      /**
       * True where the implementation is IGNORED rather than refused: the
       * widening rule of F100-FR-015 drops the entry and the launch goes on.
       */
      readonly ignored?: true;
    };

/** One record of what a run resolved from a registry (F100-FR-016). */
export type ResolvedRecord = {
  readonly ep: string;
  readonly pointId: string;
  readonly implementationId: string;
  readonly implementationClass: ImplementationClass;
  /** The major in force: the highest declared major the core supports. */
  readonly major: number;
  readonly provenance: RankLayer;
  /** F100-FR-020 — `public-contract`, or `internal-seam` for EP-18. */
  readonly standing: ExtensionPointStanding;
};

/* ------------------------------------------------------------------ *
 * The registries.
 * ------------------------------------------------------------------ */

/** The registry of one extension point (F100-FR-016). */
export type Registry = {
  readonly ep: string;
  readonly pointIds: readonly string[];
  readonly operations: readonly string[];
  readonly standing: ExtensionPointStanding;
  /** Offer an implementation; the outcome says what the registry did. */
  register(implementation: Implementation): RegistrationOutcome;
  /** The implementations the registry accepted, in the order of registration. */
  entries(): readonly Implementation[];
  /** The records a run writes and replays on resume (F100-FR-016). */
  resolved(): readonly ResolvedRecord[];
};

type MutableRegistry = {
  readonly entry: ExtensionPointEntry;
  readonly accepted: Implementation[];
  readonly records: ResolvedRecord[];
};

const REGISTRIES = new Map<string, MutableRegistry>();
let LAUNCHED = false;
let ROOT_IN_USE = ROOT;

/** F100-FR-016 — the registries are read-only after launch. */
export function markLaunched(): void {
  LAUNCHED = true;
}

/** True once the launch has frozen the registries. */
export function isLaunched(): boolean {
  return LAUNCHED;
}

/**
 * Empty every registry and unfreeze them. The frame is filled at process
 * start; a test that fills it again starts from here.
 */
export function resetFrame(root: string = ROOT): void {
  REGISTRIES.clear();
  LAUNCHED = false;
  ROOT_IN_USE = root;
}

function entryOf(pointOrId: string, root: string): ExtensionPointEntry {
  const index = loadExtensionPointIndex(root);
  const byEp = index.find((e) => e.ep === pointOrId);
  if (byEp !== undefined) return byEp;
  const byId = index.find((e) => e.ids.includes(pointOrId));
  if (byId !== undefined) return byId;
  throw new UnknownExtensionPointError(
    pointOrId,
    index.map((e) => e.ep),
  );
}

/**
 * F100-FR-016 — one registry per point of
 * `contracts/extension-points/index.json`. The argument is the point (`EP-08`)
 * or one of its ids (`specstride.event-sink/1`); anything else is refused with
 * the list of the points the index holds.
 */
export function registryOf(pointId: string, root: string = ROOT_IN_USE): Registry {
  const entry = entryOf(pointId, root);
  let registry = REGISTRIES.get(entry.ep);
  if (registry === undefined) {
    registry = { entry, accepted: [], records: [] };
    REGISTRIES.set(entry.ep, registry);
  }
  const state = registry;
  return Object.freeze({
    ep: entry.ep,
    pointIds: entry.ids,
    operations: entry.operations,
    standing: standingOf(entry.ep),
    register: (implementation: Implementation) => registerInto(state, implementation),
    entries: () => Object.freeze([...state.accepted]),
    resolved: () => Object.freeze([...state.records]),
  });
}

/** Every record a run resolved, over every point (F100-FR-016). */
export function resolvedOfTheRun(): readonly ResolvedRecord[] {
  const out: ResolvedRecord[] = [];
  for (const ep of [...REGISTRIES.keys()].sort()) {
    out.push(...(REGISTRIES.get(ep) as MutableRegistry).records);
  }
  return Object.freeze(out);
}

function registerInto(state: MutableRegistry, implementation: Implementation): RegistrationOutcome {
  const entry = state.entry;
  const pointId = implementation.pointId;

  // F100-FR-016 — read-only after launch.
  if (LAUNCHED) {
    return {
      accepted: false,
      reason: "frozen",
      message:
        `refused: the registry of ${entry.ep} is read-only after launch; ` +
        `\`${implementation.id}\` was offered after the launch (F100-FR-016)`,
    };
  }

  // F100-FR-013 — the id must be of the form, and must be an id of the point.
  if (!EXTENSION_POINT_ID_FORM.test(pointId) || !entry.ids.includes(pointId)) {
    return {
      accepted: false,
      reason: "unknown-point",
      message:
        `refused: \`${pointId}\` is no id of ${entry.ep}; its ids are ` +
        `${entry.ids.join(" and ")} (F100-FR-013)`,
    };
  }

  // F100-FR-014 — the class, from the closed set of row 83.
  if (!(IMPLEMENTATION_CLASSES as readonly string[]).includes(implementation.implementationClass)) {
    return {
      accepted: false,
      reason: "unknown-class",
      message:
        `refused: \`${implementation.implementationClass}\` is no class of an ` +
        `implementation; the classes are ${IMPLEMENTATION_CLASSES.join(", ")} ` +
        `(row ${CLASSES_ROW} of annex X §X.6: ${CLASSES_ROW_UNKNOWN_VALUE}; F100-FR-014)`,
    };
  }
  if (!CLASSES_ACCEPTED_IN_WAVE_1.includes(implementation.implementationClass)) {
    return {
      accepted: false,
      reason: "third-party-class",
      message: thirdPartyRefusedMessage(pointId),
    };
  }

  // F100-FR-013 — the declared range of majors.
  const supported = implementation.majors.filter((m) => majorIsSupported(m));
  if (supported.length === 0) {
    return {
      accepted: false,
      reason: "major-out-of-range",
      message: majorOutOfRangeMessage(pointId, implementation.majors),
      doctorWarning:
        `the implementation \`${implementation.id}\` of ${entry.ep} declares the major ` +
        `${implementation.majors.join(", ")}, outside the range the core supports ` +
        `(${supportedMajors().join(" and ")}) (F100-FR-013)`,
    };
  }

  // F100-FR-015 — the widening rule for project configuration.
  if (implementation.widensCapability === true) {
    const outcome = filterProjectKey(
      `extensionPoints.${entry.ep}.implementation`,
      implementation.id,
      "widening",
      undefined,
    );
    if (implementation.provenance === "project-configuration" && !outcome.accepted) {
      return {
        accepted: false,
        reason: "widening-from-project-configuration",
        message: outcome.launchMessage,
        doctorWarning: outcome.doctorWarning,
        ignored: true,
      };
    }
  }

  // F100-FR-014 — a data implementation is validated against its schema.
  if (implementation.implementationClass === "data") {
    if (implementation.schemaId === undefined) {
      return {
        accepted: false,
        reason: "data-invalid",
        message:
          `refused: the implementation \`${implementation.id}\` of ${entry.ep} is of the ` +
          `class \`data\` and names no schema to validate against (F100-FR-014)`,
      };
    }
    const result = validate(implementation.schemaId, implementation.value);
    if (!result.ok) {
      return {
        accepted: false,
        reason: "data-invalid",
        message:
          `refused: the data implementation \`${implementation.id}\` of ${entry.ep} does not ` +
          `validate against \`${implementation.schemaId}\` (` +
          `${result.errors.map((e) => `${e.path} ${e.message}`).join("; ")}) (F100-FR-014)`,
      };
    }
  }

  const record: ResolvedRecord = Object.freeze({
    ep: entry.ep,
    pointId,
    implementationId: implementation.id,
    implementationClass: implementation.implementationClass,
    major: Math.max(...supported),
    provenance: implementation.provenance,
    standing: standingOf(entry.ep),
  });
  state.accepted.push(implementation);
  state.records.push(record);
  return { accepted: true, record };
}

/* ------------------------------------------------------------------ *
 * F100-FR-016 — replay on resume.
 * ------------------------------------------------------------------ */

/** What a resume did with the records of the run. */
export type ReplayOutcome = {
  /** The records that are in force after the resume. */
  readonly records: readonly ResolvedRecord[];
  /** True where the resume resolved again, which needs the consumer's flag. */
  readonly resolvedAgain: boolean;
};

/** The flag by which a consumer asks a resume to resolve again (F100-FR-016). */
export const RESOLVE_AGAIN_FLAG = "--resolve-registries" as const;

/**
 * F100-FR-016 — what a run resolved is replayed on resume; a resume does not
 * resolve again unless the consumer asks for it by flag. `replayResolved`
 * puts the stored records back in force and freezes the registries.
 */
export function replayResolved(
  stored: readonly ResolvedRecord[],
  options: { readonly resolveAgain?: boolean; readonly root?: string } = {},
): ReplayOutcome {
  const root = options.root ?? ROOT_IN_USE;
  if (options.resolveAgain === true) {
    return { records: Object.freeze([]), resolvedAgain: true };
  }
  resetFrame(root);
  for (const record of stored) {
    const entry = entryOf(record.ep, root);
    let registry = REGISTRIES.get(entry.ep);
    if (registry === undefined) {
      registry = { entry, accepted: [], records: [] };
      REGISTRIES.set(entry.ep, registry);
    }
    registry.records.push(record);
  }
  markLaunched();
  return { records: resolvedOfTheRun(), resolvedAgain: false };
}

/** The one point that is an internal seam (F100-FR-020). */
export { INTERNAL_SEAM_POINT, standingOf, parseExtensionPointId };
