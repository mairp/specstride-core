/**
 * The capability-description shape of the host port EP-01 (`specstride.host/1`,
 * annex H §H.1): the six capabilities a host declares with their values and
 * their declared fallbacks, and the `describe` that composes them into the
 * `HostDescription` the port types.
 *
 * A HOST DECLARES; THE KIT SHAPES. The declarations of a host — which of the
 * six are present, what value each present one carries, why an absent one is
 * absent, the requirement that fixes each, and the row of the host's own
 * verification record each rests on with its pin — are INPUT of every
 * function here, never constants of the kit: they are facts of the host, and
 * the kit names no host. The same holds for the rendering data of
 * `contracts/host-package.md` (the skill-naming rule, the description cap, the
 * packaging form) and for the host hook events a `hooks` capability names:
 * the `HostHookEvent` shape is the kit's, the list of events is the host's.
 * What the kit fixes is everything that must not drift from the annex: the
 * `Values` column and the declared fallback of a capability are read from
 * `@specstride/contracts/ep/host` and never spelled out here.
 *
 * An unknown capability is IGNORED (the port's F113-FR-029, here the
 * annex's own rule): `describe` neither fails nor carries it into its output,
 * and the kit's `describeCapabilities` names what was ignored so that
 * "ignored" is observable without being an error.
 *
 * The module moved here from `packages/host-claude-code/src/describe/index.ts`
 * (the split of the monorepo, U-1 and U-2 of `specs/120-host-dsh`), which
 * keeps the old path and binds these functions to that host's own
 * declarations and rendering. It runs in the BUILD, not on the consumer's
 * machine, so it imports `@specstride/contracts`; the shim core of this kit
 * may not.
 */
import {
  CAPABILITIES,
  DOCTOR_SKILL_ID,
  HOST_SKILL_IDS,
  capabilityRows,
  fallbackOf,
  unknownCapabilityIsIgnored,
} from "@specstride/contracts/ep/host";
import type { HostCapability, HostDescription } from "@specstride/contracts/ep/host";

/* -------------------------------------------------------------------------
 * The shapes a host fills
 * ---------------------------------------------------------------------- */

/**
 * One host hook event a `hooks` capability names. The SHAPE is the kit's; the
 * list of events is the host's (this host's own spelling of an event, where
 * documentation gives it, is a HOST fact and stays `null` until a live capture
 * settles it).
 */
export type HostHookEvent = {
  /** The id of the event in the product's words; it is the value `hooks` carries. */
  readonly id: string;
  /** What the shim of the event prints. */
  readonly prints: string;
  /** The requirement that specifies the event. */
  readonly requirement: string;
  /**
   * The host's own spelling of the event, where documentation gives it, else
   * `null`.
   */
  readonly hostSpelling: string | null;
};

/**
 * One capability declaration (data-model.md, "Capability declaration": each
 * with value and fallback). The host builds one per capability of annex
 * H §H.1 with `capabilityDeclaration`, which reads the `Values` column and the
 * declared fallback from the contracts and takes everything else as given.
 */
export type CapabilityDeclaration = {
  /** The capability, one of the six of annex H §H.1. */
  readonly capability: HostCapability;
  /** The `Values` column of the table of the annex, verbatim. */
  readonly values: string;
  /** True where this host offers the capability; false where it is absent. */
  readonly present: boolean;
  /**
   * The value this host declares, or `null` where the capability is absent.
   * `hooks` carries the ids of the host's hook events.
   */
  readonly value: string | readonly string[] | null;
  /** The declared fallback of annex H §H.1, which applies while it is absent. */
  readonly fallback: string;
  /** Why the capability is absent, or `null` where it is present. */
  readonly absentBecause: string | null;
  /** The requirement that fixes the declaration. */
  readonly requirement: string;
  /** The row of the host's verification record the declaration rests on. */
  readonly hostFact: string;
  /** The version pin of the host fact. */
  readonly pin: string;
};

/**
 * The rendering data of `contracts/host-package.md` a host passes with its
 * declarations: how its skills are spelled and how its plugin is packaged.
 * There is no default — a kit that named a rendering would name a host.
 */
export type CapabilityRendering = {
  /** The naming rule of a skill of this host, as `renderEntry` applies it. */
  readonly skillNamingRule: string;
  /** The cap of a skill description for this host, in characters. */
  readonly descriptionCap: number;
  /** The packaging form of this host. */
  readonly packagingForm: string;
};

/** One row of the verification record a host fact answers with, as read. */
export type CapabilityHostFactStatus = {
  readonly status?: string;
};

/* -------------------------------------------------------------------------
 * What never drifts from annex H §H.1
 * ---------------------------------------------------------------------- */

/** The `Values` column of the table of annex H §H.1 for a capability. */
export function valuesColumnOf(capability: HostCapability): string {
  const row = capabilityRows.find((r) => r.capability === capability);
  if (row === undefined) {
    throw new Error(`annex H §H.1 holds no capability \`${capability}\``);
  }
  return row.values;
}

/** True for one of the six capabilities of annex H §H.1. */
export function isKnownCapability(name: string): name is HostCapability {
  return (CAPABILITIES as readonly string[]).includes(name);
}

/**
 * The names outside the six capabilities of annex H §H.1, in the order they
 * were given. They are IGNORED, never an error.
 */
export function ignoredCapabilities(names: readonly string[]): readonly string[] {
  return Object.freeze(names.filter((name) => unknownCapabilityIsIgnored(name)));
}

/**
 * The logical ids of the skills of the product, for a reader of `describe`:
 * the two host skills and the doctor skill. The host's own SPELLING of each is
 * its render, not the kit's; `describe` carries only the naming rule.
 */
export const SKILL_IDS: readonly string[] = Object.freeze([...HOST_SKILL_IDS, DOCTOR_SKILL_ID]);

/* -------------------------------------------------------------------------
 * Building a declaration
 * ---------------------------------------------------------------------- */

/**
 * One capability declaration of a host (the `declare` of the module this
 * shape moved out of). The `Values` column and the declared fallback are read
 * from `@specstride/contracts/ep/host` — never spelled out by a caller — and
 * everything that is a fact of the host comes in as given.
 */
export function capabilityDeclaration(input: {
  readonly capability: HostCapability;
  readonly present: boolean;
  readonly value: string | readonly string[] | null;
  readonly absentBecause: string | null;
  readonly requirement: string;
  readonly hostFact: string;
  readonly pin: string;
}): CapabilityDeclaration {
  return Object.freeze({
    capability: input.capability,
    values: valuesColumnOf(input.capability),
    present: input.present,
    value: Array.isArray(input.value) ? Object.freeze([...input.value]) : input.value,
    // Never spelled out by a caller: read from the table of annex H §H.1.
    fallback: fallbackOf(input.capability),
    absentBecause: input.absentBecause,
    requirement: input.requirement,
    hostFact: input.hostFact,
    pin: input.pin,
  });
}

/* -------------------------------------------------------------------------
 * Reading the declarations of a host
 * ---------------------------------------------------------------------- */

/** The declaration of a capability of a host, or `undefined` for a name outside the six. */
export function declarationOf(
  declarations: readonly CapabilityDeclaration[],
  capability: string,
): CapabilityDeclaration | undefined {
  return declarations.find((d) => d.capability === capability);
}

/** The capabilities a host offers, in the order of the annex. */
export function presentCapabilities(
  declarations: readonly CapabilityDeclaration[],
): readonly HostCapability[] {
  return Object.freeze(declarations.filter((d) => d.present).map((d) => d.capability));
}

/** The capabilities that are absent for a host; each uses its declared fallback. */
export function absentCapabilities(
  declarations: readonly CapabilityDeclaration[],
): readonly HostCapability[] {
  return Object.freeze(declarations.filter((d) => !d.present).map((d) => d.capability));
}

/**
 * The declared fallback of a capability that is absent for a host ("Each
 * absent one MUST use its declared fallback"). It is the fallback of the table
 * of annex H §H.1 and of no other source. A capability the host offers has no
 * fallback to use, and asking for one is an error of the caller; the host's
 * name is passed so the error says who declared it.
 */
export function fallbackInUse(
  declarations: readonly CapabilityDeclaration[],
  capability: HostCapability,
  hostName: string,
): string {
  const declaration = declarationOf(declarations, capability);
  if (declaration === undefined) {
    throw new Error(`annex H §H.1 holds no capability \`${capability}\``);
  }
  if (declaration.present) {
    throw new Error(
      `the capability \`${capability}\` is declared by ${hostName}, so no fallback is in ` +
        `use; the declared fallback of annex H §H.1 applies only to an absent capability`,
    );
  }
  return declaration.fallback;
}

/** The fallbacks in use for a host, keyed by the absent capability. */
export function fallbacksInUse(
  declarations: readonly CapabilityDeclaration[],
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const declaration of declarations) {
    if (!declaration.present) out[declaration.capability] = declaration.fallback;
  }
  return Object.freeze(out);
}

/**
 * The declarations for the capabilities a caller asks about, with every
 * unknown name ignored. The result names what was ignored, so that "ignored"
 * is observable without being an error.
 */
export function describeCapabilities(
  declarations: readonly CapabilityDeclaration[],
  names: readonly string[],
): {
  readonly declared: readonly CapabilityDeclaration[];
  readonly ignored: readonly string[];
} {
  const declared: CapabilityDeclaration[] = [];
  for (const name of names) {
    const declaration = declarationOf(declarations, name);
    if (declaration !== undefined) declared.push(declaration);
  }
  return Object.freeze({
    declared: Object.freeze(declared),
    ignored: ignoredCapabilities(names),
  });
}

/* -------------------------------------------------------------------------
 * `describe`
 * ---------------------------------------------------------------------- */

function valueOrNull(
  declarations: readonly CapabilityDeclaration[],
  capability: HostCapability,
): string | null {
  const declaration = declarationOf(declarations, capability);
  if (declaration === undefined || !declaration.present) return null;
  return typeof declaration.value === "string" ? declaration.value : null;
}

/**
 * `describe` of EP-01 for the host whose declarations and rendering are
 * given. Every one of the six capabilities of annex H §H.1 is declared; an
 * absent one is `null` (or `false` for the two that the port types as a
 * boolean), which is what makes the product use the declared fallback of the
 * annex — `fallbacksInUse(declarations)` names the fallback of each. A
 * capability of the host that no declaration carries is unknown here and is
 * ignored, so the output never grows a key of its own.
 */
export function describeOf(
  declarations: readonly CapabilityDeclaration[],
  rendering: CapabilityRendering,
): HostDescription {
  const hooks = declarationOf(declarations, "hooks");
  const hookIds =
    hooks !== undefined && hooks.present && Array.isArray(hooks.value)
      ? Object.freeze([...hooks.value])
      : null;
  return Object.freeze({
    skillNaming: Object.freeze({
      rule: rendering.skillNamingRule,
      descriptionCap: rendering.descriptionCap,
    }),
    hooks: hookIds,
    background: valueOrNull(declarations, "background"),
    statusSurface: valueOrNull(declarations, "statusSurface"),
    evals: valueOrNull(declarations, "evals"),
    packagingForm: rendering.packagingForm,
    stateRootWritable: declarationOf(declarations, "stateRootWritable")?.present === true,
    model: declarationOf(declarations, "model")?.present === true,
  });
}

/**
 * True while the verification-record row a host's declarations rest on says
 * `unverified`: every declaration then rests on documentation and the pin,
 * and a declaration must never claim a capture that was not run. The row is
 * the host's own (the kit reads no verification record of its own); no row at
 * all — `undefined` — is not an unverified row, and reads as `false`, exactly
 * as the module this shape moved out of answered.
 */
export function capabilitiesAreUnverified(fact: CapabilityHostFactStatus | undefined): boolean {
  return fact?.status === "unverified";
}
