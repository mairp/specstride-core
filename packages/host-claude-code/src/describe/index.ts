/**
 * T005 of `specs/113-host-claude-code/tasks.md` — `describe` of EP-01 for THIS
 * host: the six capabilities with their values and their fallbacks
 * (F113-FR-028, F113-FR-029).
 *
 * F113-FR-028: "`describe` MUST declare the six capabilities of annex H §H.1
 * with their values: `hooks` (the events of F113-FR-021 to F113-FR-024),
 * `statusSurface`, `background`, `evals` (native), `model` (yes),
 * `stateRootWritable` (`unverified` until the spike of feature 122 reports).
 * Each absent one MUST use its declared fallback."
 *
 * The SHAPE lives in `@specstride/host-kit` (`src/describe.ts` of the kit, the
 * split of the monorepo, U-1): the declaration type, the factory that reads
 * the `Values` column and the declared fallback of a capability from
 * `@specstride/contracts/ep/host`, and the reading, fallback and `describe`
 * functions over a host's declarations. THIS module holds what is a fact of
 * the host and cannot be the kit's:
 *
 *  - the four host hook events of F113-FR-021 to F113-FR-024, with the host's
 *    own spelling of each, and the two events of F113-FR-025 that this plugin
 *    registers no hook on;
 *  - the six declarations as THIS host makes them — what is present and what
 *    is absent here, the requirement of feature 113 each rests on, and the
 *    row `six-capabilities-of-the-host` of this host's verification record
 *    (`../host-facts.ts`) with its pin `claude-code@2.1.284`;
 *  - the rendering of `contracts/host-package.md` as this host spells it: the
 *    `specstride-` prefix of the naming rule, the 1,536-character description
 *    cap, the plugin-directory packaging form;
 *  - the binding of the kit functions to that data, so every import path of
 *    this module keeps its shape.
 *
 * Two of the six are ABSENT here, and each uses the declared fallback of the
 * table of annex H §H.1 — which no module here spells out itself but reads
 * from `@specstride/contracts/ep/host`, the machine-readable form of that
 * table, so that a fallback cannot drift from the annex:
 *
 *  - `background`: the host's own background job mode is considered and
 *    rejected as the runtime (F113-FR-032, R3v C1), and the one remaining
 *    candidate for "a primitive that re-invokes the host when a command exits"
 *    is the re-waking host hook, whose lifetime and re-arming are a fact the
 *    PAID capture of T001 would settle and which is `unverified`
 *    (`../host-facts.ts`, row `re-waking-host-hook-lifetime`). While it is
 *    unverified the capability is declared absent and the fallback applies.
 *  - `stateRootWritable`: `unverified` until the spike of feature 122 reports
 *    (F113-FR-028, in those words).
 *
 * The four present ones carry a value. Nothing here claims a capture that was
 * not run: the host's own spelling of the four host hook events, and the six
 * capabilities "as the host reports them", stay `unverified` with the pin
 * `claude-code@2.1.284` (F113-FR-035).
 *
 * This module runs in the BUILD, not on the consumer's machine, so it may
 * import `@specstride/contracts` and `@specstride/host-kit`; `src/shim/` may
 * import neither (rule RF-113-01).
 */
import type { HostCapability, HostDescription } from "@specstride/contracts/ep/host";
import { HOST_PIN, factOf } from "../host-facts.ts";
import type { CapabilityDeclaration, HostHookEvent } from "@specstride/host-kit";
import {
  capabilityDeclaration,
  declarationOf as declarationOfShape,
  presentCapabilities as presentCapabilitiesShape,
  absentCapabilities as absentCapabilitiesShape,
  fallbackInUse as fallbackInUseShape,
  fallbacksInUse as fallbacksInUseShape,
  describeCapabilities as describeCapabilitiesShape,
  describeOf,
  capabilitiesAreUnverified as capabilitiesAreUnverifiedShape,
} from "@specstride/host-kit";

/* -------------------------------------------------------------------------
 * Shapes and rules the kit fixes (re-exported, bound to nothing)
 * ---------------------------------------------------------------------- */

export {
  /**
   * The logical ids of the skills of the product: the two host skills of
   * F100-FR-194 and the doctor skill.
   */
  SKILL_IDS,
  /** True for one of the six capabilities of annex H §H.1. */
  isKnownCapability,
  /** The names outside the six, which `describe` ignores (F113-FR-029). */
  ignoredCapabilities,
  /** The `Values` column of the table of annex H §H.1, read from the contracts. */
  valuesColumnOf,
} from "@specstride/host-kit";
export type {
  /** One host hook event: the shape is the kit's, the events are the host's. */
  HostHookEvent,
  /** One capability declaration, as the kit types it. */
  CapabilityDeclaration,
} from "@specstride/host-kit";

/* -------------------------------------------------------------------------
 * The rendering of `contracts/host-package.md`, as THIS host spells it
 * ---------------------------------------------------------------------- */

/**
 * The naming rule of skills of this host: a skill is a directory whose name is
 * the skill's name, lower case with hyphens, and every skill of this plugin
 * carries the product's prefix so that two plugins do not collide. It is the
 * rule `renderEntry` of `../render/index.ts` applies.
 */
export const SKILL_NAMING_RULE =
  "lower-case letters, digits and hyphens; one directory per skill, " +
  "named after the skill, holding `SKILL.md`; every skill of this plugin " +
  "carries the prefix `specstride-`";

/** The cap of a skill description for this host, in characters. */
export const DESCRIPTION_CAP = 1536 as const;

/** The packaging form of this host: a plugin directory. */
export const PACKAGING_FORM = "plugin directory" as const;

/* -------------------------------------------------------------------------
 * The four host hook events the `hooks` capability names (F113-FR-021..024)
 * ---------------------------------------------------------------------- */

/**
 * The four events of F113-FR-021 to F113-FR-024, in the order of the
 * requirements: session start, prompt submission, the guardrail before a shell
 * command, and a limit event the host observes. F113-FR-025 registers NO event
 * on stop and none after a tool use that injects context, so the list is four
 * and not six.
 */
export const HOST_HOOK_EVENTS: readonly HostHookEvent[] = Object.freeze([
  Object.freeze({
    id: "session-start",
    prints: "one status line with `validUntil`, or nothing when no run exists",
    requirement: "F113-FR-021",
    hostSpelling: "SessionStart",
  }),
  Object.freeze({
    id: "prompt-submit",
    prints: "nothing unless the state or the phase changed since the last injection, then one line",
    requirement: "F113-FR-022",
    hostSpelling: "UserPromptSubmit",
  }),
  Object.freeze({
    id: "guard-before-shell",
    prints: "one line that denies, where a launch check would refuse",
    requirement: "F113-FR-023",
    hostSpelling: "PreToolUse",
  }),
  Object.freeze({
    id: "host-limit-event",
    prints:
      "nothing: it writes an inbox request of type `host-event` through the CLI and injects " +
      "no context",
    requirement: "F113-FR-024",
    hostSpelling: null,
  }),
]);

/** The ids of the four events: the value the capability `hooks` carries. */
export const HOST_HOOK_EVENT_IDS: readonly string[] = Object.freeze(
  HOST_HOOK_EVENTS.map((e) => e.id),
);

/** F113-FR-025 — the two events this plugin registers no host hook on. */
export const EVENTS_NEVER_REGISTERED: readonly string[] = Object.freeze([
  "stop",
  "after-tool-use-that-injects-context",
]);

/* -------------------------------------------------------------------------
 * The six capability declarations, as THIS host makes them
 * ---------------------------------------------------------------------- */

/** The row of the verification record (`../host-facts.ts`) every declaration rests on. */
export const CAPABILITY_HOST_FACT = "six-capabilities-of-the-host" as const;

/**
 * The six capabilities of annex H §H.1 as this host declares them, in the
 * order of the table of the annex (F113-FR-028). Four are present and two are
 * absent; each absent one carries the declared fallback of the annex. The
 * `Values` column and the fallback of each are read from the contracts by the
 * kit's `capabilityDeclaration`, never spelled out here.
 */
export const CAPABILITY_DECLARATIONS: readonly CapabilityDeclaration[] = Object.freeze([
  capabilityDeclaration({
    capability: "hooks",
    present: true,
    value: HOST_HOOK_EVENT_IDS,
    absentBecause: null,
    requirement: "F113-FR-028 (the events of F113-FR-021 to F113-FR-024)",
    hostFact: CAPABILITY_HOST_FACT,
    pin: HOST_PIN,
  }),
  capabilityDeclaration({
    capability: "statusSurface",
    present: true,
    value: "the host's status line, and the context of the four host hook events",
    absentBecause: null,
    requirement: "F113-FR-028",
    hostFact: CAPABILITY_HOST_FACT,
    pin: HOST_PIN,
  }),
  capabilityDeclaration({
    capability: "background",
    present: false,
    value: null,
    absentBecause:
      "The host's own background job mode is considered and rejected as the runtime " +
      "(F113-FR-032, R3v C1), and the lifetime and re-arming of the one re-waking host hook " +
      "that could re-invoke the host is a fact of the PAID capture of T001 and is " +
      "`unverified`. While it is unverified the capability is absent and the declared " +
      "fallback applies (F113-FR-013: every supervision cycle costs at most 150 tokens).",
    requirement: "F113-FR-028",
    hostFact: CAPABILITY_HOST_FACT,
    pin: HOST_PIN,
  }),
  capabilityDeclaration({
    capability: "evals",
    present: true,
    value: "native: the host's own suite runner",
    absentBecause: null,
    requirement: "F113-FR-028 (native)",
    hostFact: CAPABILITY_HOST_FACT,
    pin: HOST_PIN,
  }),
  capabilityDeclaration({
    capability: "model",
    present: true,
    value: "yes",
    absentBecause: null,
    requirement: "F113-FR-028 (yes)",
    hostFact: CAPABILITY_HOST_FACT,
    pin: HOST_PIN,
  }),
  capabilityDeclaration({
    capability: "stateRootWritable",
    present: false,
    value: null,
    absentBecause:
      "`unverified` until the spike of feature 122 reports (F113-FR-028, in those words). " +
      "The declaration claims nothing the spike has not reported, so the capability is " +
      "absent and the declared fallback applies.",
    requirement: "F113-FR-028",
    hostFact: CAPABILITY_HOST_FACT,
    pin: HOST_PIN,
  }),
]);

/* -------------------------------------------------------------------------
 * The kit shape, bound to THIS host
 * ---------------------------------------------------------------------- */

/** The rendering data this host passes to the kit's `describeOf`. */
const RENDERING = {
  skillNamingRule: SKILL_NAMING_RULE,
  descriptionCap: DESCRIPTION_CAP,
  packagingForm: PACKAGING_FORM,
} as const;

/** The declaration of a capability of this host, or `undefined` outside the six. */
export const declarationOf = (capability: string): CapabilityDeclaration | undefined =>
  declarationOfShape(CAPABILITY_DECLARATIONS, capability);

/** The capabilities this host offers, in the order of the annex. */
export const presentCapabilities = (): readonly HostCapability[] =>
  presentCapabilitiesShape(CAPABILITY_DECLARATIONS);

/** The capabilities that are absent here; each uses its declared fallback. */
export const absentCapabilities = (): readonly HostCapability[] =>
  absentCapabilitiesShape(CAPABILITY_DECLARATIONS);

/**
 * The declared fallback of a capability that is absent here (F113-FR-028:
 * "Each absent one MUST use its declared fallback"). It is the fallback of the
 * table of annex H §H.1 and of no other source. A capability this host offers
 * has no fallback to use, and asking for one is an error of the caller.
 */
export const fallbackInUse = (capability: HostCapability): string =>
  fallbackInUseShape(CAPABILITY_DECLARATIONS, capability, "Claude Code");

/** The fallbacks in use here, keyed by the absent capability. */
export const fallbacksInUse = (): Readonly<Record<string, string>> =>
  fallbacksInUseShape(CAPABILITY_DECLARATIONS);

/**
 * The declarations for the capabilities a caller asks about, with every
 * unknown name ignored (F113-FR-029). The result names what was ignored, so
 * that "ignored" is observable without being an error.
 */
export const describeCapabilities = (names: readonly string[]) =>
  describeCapabilitiesShape(CAPABILITY_DECLARATIONS, names);

/**
 * `describe` of EP-01 for this host (F113-FR-028). Every one of the six
 * capabilities of annex H §H.1 is declared; an absent one is `null` (or
 * `false` for the two that the port types as a boolean), which is what makes
 * the product use the declared fallback of the annex — `fallbacksInUse()`
 * names the fallback of each.
 *
 * `stateRootWritable` is `false` because it is `unverified` until the spike of
 * feature 122 reports (F113-FR-028): the declaration claims no write the spike
 * has not reported.
 */
export const describe = (): HostDescription => describeOf(CAPABILITY_DECLARATIONS, RENDERING);

/**
 * True while the PAID capture of T001 has not settled the capabilities of this
 * host: the row `six-capabilities-of-the-host` of the verification record is
 * `unverified`, so every declaration above rests on documentation and the pin
 * (F113-FR-035). A declaration must never claim a capture that was not run.
 */
export const capabilitiesAreUnverified = (): boolean =>
  capabilitiesAreUnverifiedShape(factOf(CAPABILITY_HOST_FACT));
