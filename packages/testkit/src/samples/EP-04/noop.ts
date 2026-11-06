/**
 * T058 of feature 103 — THE SAMPLE LAYER `noop`, outside the core
 * (F103-FR-023, F103-FR-025; annex D §D.1, "Proving test" (ii)).
 *
 * The inert layer: it returns `none` at every one of the eight call points and
 * declares NO directive and NO service, so there is nothing the engine has to
 * offer it and nothing it can ask the engine to do. It is the subject of the
 * inertness suite: with it registered, the output of the oracle equals the
 * classic loop apart from the fields the divergence register names.
 *
 * ## Why `contributePrompt` returns no block
 *
 * `none` at `contributePrompt` is the empty list of blocks. The PROTOCOL BLOCK
 * of a layer is not contributed here: F103-FR-038 has the provider of the layer
 * add it at pass level, through EP-15, and marks it protected. `PROTOCOL_BLOCK`
 * of `./index.ts` is that block, kept there for the proving test of §D.5; this
 * layer, at this interface, adds nothing.
 *
 * ## It lives in the test tree, and is registered from there only
 *
 * F100-FR-018 — the sample is first-party code of the test kit. The conformance
 * suite registers it; no file of `@specstride/core` names it, and this file
 * imports nothing of the core. It depends on `@specstride/contracts` alone,
 * which is where the interface it implements lives.
 */
import { RETURN_WHEN_UNKNOWN } from "@specstride/contracts/ep/loop-layer";
import type {
  AfterPassResult,
  BetweenPassesOutcome,
  LayerRegistration,
  LoopLayer,
  PromptBlock,
} from "@specstride/contracts/ep/loop-layer";

/** The id of the sample layer, which is also its ledger namespace. */
export const NOOP_LAYER_ID = "noop" as const;

/** F103-FR-025 — it declares no directive and no service. */
export const noopRegistration: LayerRegistration = Object.freeze({
  id: NOOP_LAYER_ID,
  directives: Object.freeze([]),
  services: Object.freeze([]),
  ledgerNamespace: NOOP_LAYER_ID,
});

/** The fields of the `[LOOP]` line of a layer that never engaged. */
export const NOOP_REPORT: Readonly<Record<string, unknown>> = Object.freeze({
  layer: NOOP_LAYER_ID,
  engaged: false,
  units: 0,
});

/**
 * F103-FR-023 — `none` at every call point. The two points whose return is not
 * a word say `none` in the shape of that point: no block, and the inert fields
 * of a layer that never engaged.
 */
export const noopLayer: LoopLayer = Object.freeze({
  registration: noopRegistration,
  contributePrompt(): readonly PromptBlock[] {
    return Object.freeze([]);
  },
  afterPass(): AfterPassResult {
    return RETURN_WHEN_UNKNOWN;
  },
  betweenPasses(): BetweenPassesOutcome | "none" {
    return "none";
  },
  nextPassBlock(): PromptBlock | "none" {
    return "none";
  },
  onEvidence(): { readonly closingCheck: boolean } | "none" {
    return "none";
  },
  contributeCriticInput(): readonly Readonly<Record<string, unknown>>[] | "none" {
    return "none";
  },
  resume(): BetweenPassesOutcome | "none" {
    return "none";
  },
  report(): Readonly<Record<string, unknown>> {
    return NOOP_REPORT;
  },
});

/** How many units of work this layer ever declares. */
export const NOOP_DECLARES_A_UNIT_OF_WORK = false as const;
