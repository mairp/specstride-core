/**
 * The loop configuration of a run (feature 115, F115-FR-001): the strategy
 * `loop.strategy` (default `micro`), the closing-check switch
 * `loop.micro.closing_check` and the caps `loop.micro.caps.*`, resolved
 * through the REAL configuration of feature 110 — the user file, the project
 * file `specstride.yaml` of the workspace, the environment and the defaults
 * of the catalogue — never a copy of the merge.
 *
 * There is no environment alias for `loop.strategy`: the value comes from a
 * configuration file or from the default, which is what the catalogue's
 * layers and the merge give us on their own.
 */
import { realpathSync } from "node:fs";
import {
  loadConfigFiles,
  resolveConfiguration,
  type ResolvedConfiguration,
} from "@specstride/config";
import { capsFor, type Caps } from "../../../layer-micro/src/caps/caps.ts";
import {
  ALLOW_DETECT_KEY,
  UNITS_KEY,
  WORKERS_KEY,
  WORKERS_MAX_KEY,
  type AllowDetectConfiguration,
  type UnitsConfiguration,
  type WorkerCountConfiguration,
} from "../../../layer-parallel/src/index.ts";
import { MAX_BYTES_DEFAULT } from "../../../core/src/carry/handoff.ts";
import { REJECT_LIMIT_DEFAULT } from "../../../core/src/gate/limits.ts";
import { NO_PROGRESS_STRUCTURED_KEY } from "../../../core/src/pass-loop/accounting.ts";
import { REQUEST_DEFAULTS } from "../../../core/src/pass-loop/request.ts";

/** The key of the pass handoff switch (feature 153, row 8 of annex E §E.2). */
export const LEDGER_HANDOFF_KEY = "carry.ledger_handoff";

/** The strategies of the closed set of row 55 (`classic`, `micro`). */
export type LoopStrategy = "micro" | "classic";

/** The key of annex X §X.7 row 36 that names the proposer (F124-FR-026). */
export const PROPOSER_NAME_KEY = "roles.proposer.harness";

/**
 * F124-FR-026 — the name of the proposer of a run: the as-is variable
 * `SPECSTRIDE_PROPOSER` (an alias of the row-36 key, read at rank 4 by the
 * merge), the key `roles.proposer.harness` in the project file (rank 5; the
 * key's trust class is neutral, §K.1 row 36), or the same key in the user
 * configuration (rank 6). The ranks of F110-FR-014 decide between them.
 * Nothing here reads `SPECSTRIDE_CONFIG`: the launch allow list of §F.6 may
 * carry that name across, but no reader of the product consumes it — this
 * function reads the ordinary files instead (`user:config` and the workspace
 * `specstride.yaml`).
 */
export function proposerNameOf(input: {
  readonly home: string;
  readonly workdir: string;
  readonly environment: NodeJS.ProcessEnv;
}): string | undefined {
  const files = loadConfigFiles({
    home: input.home,
    // The configuration home the ENVIRONMENT names (F110-FR-003): a run whose
    // environment sets `XDG_CONFIG_HOME` — a parity drive of the oracle among
    // them — reads its user configuration there, and that is where the
    // selection of the named profile `parity` stands.
    ...(input.environment.XDG_CONFIG_HOME === undefined
      ? {}
      : { xdgConfigHome: input.environment.XDG_CONFIG_HOME }),
    workspaceRealPath: realpathSync(input.workdir),
    startDir: input.workdir,
  });
  const resolved = resolveConfiguration({
    ...(files.user === undefined ? {} : { user: files.user }),
    ...(files.project === undefined ? {} : { project: files.project }),
    environment: input.environment,
    aliasTable: true,
  });
  const merged = resolved.values.get(PROPOSER_NAME_KEY);
  const value = merged?.value;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** The loop configuration of a run, as the composition root reads it. */
export type LoopConfiguration = {
  /**
   * The named profile the merge selected (`undefined` where none did). Under
   * the `parity` profile the run restores the as-is state layout: the gate
   * files stand in the feature's `gates/` directory and the control plane
   * stands in the as-is state directory (row 116 of annex X §X.7), so the
   * oracle's parity drive of THIS engine reproduces the reference run.
   */
  readonly profile: string | undefined;
  /** The strategy in force (`micro` by default, F115-FR-001). */
  readonly strategy: LoopStrategy;
  /** `loop.micro.closing_check` (on by default, F115-FR-028). */
  readonly closingCheck: boolean;
  /** `loop.micro.caps.checkMin`, the time limit of one inner check, minutes. */
  readonly checkMin: number;
  /** The caps of F115-FR-022, with the defaults where the configuration is silent. */
  readonly caps: Caps;
  /** Where the strategy came from: a configuration file or the default. */
  readonly source: "configured" | "default";
  /** The configured value, as the configuration named it, when one did. */
  readonly configuredValue: unknown;
  /**
   * The raw value the merge resolved for `commit.backpressure` (feature 152,
   * row 134 of annex X §X.7), or `undefined` where no source held it. The
   * composition root passes it to `commitBackpressureIsOn`, whose default is
   * ON, so the key not held keeps the gate on and the `parity` profile's
   * annotated off switches it off.
   */
  readonly backpressureValue: unknown;
  /**
   * `verification.timeLimit.enforce` (feature 153, row 135 of annex X §X.7),
   * on by default and on under `parity` (CQ-153-13 A: a ruled defect fix). A
   * project-file value that would turn it off is ignored: the project file may
   * only narrow, and lifting the limit is not narrowing (F153-FR-005).
   */
  readonly timeLimitEnforced: boolean;
  /**
   * `loop.micro.closingCheck.skipWhenEqualToGate` (feature 153, row 136), on
   * by default and off under `parity`.
   */
  readonly closingCheckSkipsWhenEqualToGate: boolean;
  /**
   * `verification.inner.scoped` (feature 153, row 137), on by default and off
   * under `parity`.
   */
  readonly innerChecksAreScoped: boolean;
  /**
   * `critic.evidence.perTask` (feature 153, row 138), on by default and off
   * under `parity`.
   */
  readonly criticEvidenceIsPerTask: boolean;
  /**
   * `carry.ledger_handoff` (feature 153, row 8 of annex E §E.2), ON by
   * default and OFF under `parity` (F153-FR-059 — every pass is fresh under
   * parity, so the pass handoff of F103-FR-041 is written no more there).
   */
  readonly ledgerHandoff: boolean;
  /**
   * `carry.handoffMaxBytes` (feature 103), in bytes, default
   * `MAX_BYTES_DEFAULT` of the handoff writer.
   */
  readonly handoffMaxBytes: number;
  /**
   * `verification.parallelism` (feature 148, row 7 of annex E §E.2): a whole
   * number, default 1, ceiling 4. The trust class is `N lo` — a rank may
   * only narrow (lower) the value a rank above it held — so the effective
   * value is the LOWEST whole value any source held, clamped into 1 to 4,
   * and the `parity` profile reads 1, as the profile's own row 7 does.
   */
  readonly verificationParallelism: number;
  /**
   * `verification.redGate.ownBudget` (feature 153, row 139 of annex X §X.7),
   * on by default and OFF under `parity` (F153-FR-020: under parity a red
   * gate is a rejection with code 10 that counts toward the reject limit).
   */
  readonly redGateOwnBudget: boolean;
  /**
   * `verification.redGate.limit` (F153-FR-021), the size of the red gate's
   * own budget: a whole number, at least 1, default 3 (CQ-153-05 budget A).
   * The trust class is `N lo` — a rank may only narrow (lower) the value a
   * rank above it held — so the effective value is the LOWEST whole value
   * any source held; a source value that is not a finite whole number ≥ 1 is
   * refused at launch, never clamped into shape. No setting makes it
   * unbounded (F153-FR-021): the key reads no `SPECSTRIDE_LIMITS` and no
   * limits-off state.
   */
  readonly redGateLimit: number;
  /** The keys of the loop layer `parallel`, as the ranks the layer reads. */
  readonly parallel: ParallelLoopConfiguration;
  /**
   * `loop.maxIter` (F103-FR-003), whole number, default 30. The as-is
   * variable `SPECSTRIDE_MAX_ITER` is the key's rank-4 alias (§K.8), so it
   * reaches this value through the alias table of F110-FR-020.
   */
  readonly maxIter: number;
  /**
   * `loop.maxRejects` (F101-FR-014), whole number, default 3. The as-is
   * variable `SPECSTRIDE_MAX_REJECTS` is the key's rank-4 alias (§K.8).
   */
  readonly maxRejects: number;
  /**
   * `loop.noProgressStructured` (F103-FR-018, row 59 of annex X §X.7): on by
   * default and off under the `parity` profile, where the baseline's defect
   * D-44 — no structured no-progress measurement — is kept.
   */
  readonly noProgressStructured: boolean;
};

/**
 * The keys of the loop layer `parallel` (feature 142), as the real merge of
 * feature 110 resolved them. The layer reads ranks by name (annex X §X.2), the
 * merge gives the winning rank layer and everything a higher rank shadowed, so
 * this record maps one onto the other: no rank of the layer is re-implemented
 * here, and no value of the merge is read twice.
 */
export type ParallelLoopConfiguration = {
  /** The ranks of `loop.parallel.units` the layer reads, filled from the merge. */
  readonly units: UnitsConfiguration;
  /** The two worker-count keys, by the source the layer trusts for each. */
  readonly workers: WorkerCountConfiguration;
  /** `loop.parallel.quota_headroom`, in per cent, where configuration set it. */
  readonly quotaHeadroomPerCent?: number;
  /** Where `loop.parallel.allow_detect` was found, for the layer's own reading. */
  readonly allowDetect: AllowDetectConfiguration;
};

/** The rank layer of the merge a rank name of the units switch answers to. */
const UNITS_RANK_OF_LAYER: Readonly<Partial<Record<string, keyof UnitsConfiguration>>> =
  Object.freeze({
    "launch-contract-pin": "launchContractPin",
    flag: "flag",
    environment: "environment",
    "project-configuration": "projectConfiguration",
    "user-configuration": "userConfiguration",
  });

/** The rank layer of the merge a source of the worker count answers to. */
const WORKERS_SOURCE_OF_LAYER: Readonly<
  Partial<Record<string, keyof Omit<WorkerCountConfiguration, never>>>
> = Object.freeze({
  "launch-contract-pin": "launchContract",
  "user-configuration": "userConfiguration",
  "project-configuration": "projectConfiguration",
});

/** The rank layer of the merge a source of `allow_detect` answers to. */
const ALLOW_DETECT_SOURCE_OF_LAYER: Readonly<
  Partial<Record<string, keyof AllowDetectConfiguration>>
> = Object.freeze({
  environment: "environment",
  flag: "flag",
  "project-configuration": "projectConfiguration",
  "user-configuration": "userConfiguration",
});

/**
 * The effective value of one key and everything a higher rank shadowed, as
 * the sources the layer names: the winner first, then the shadowed values.
 */
function offersOf(
  resolved: ResolvedConfiguration,
  key: string,
): readonly { readonly layer: string; readonly value: unknown }[] {
  const merged = resolved.values.get(key);
  if (merged === undefined) return Object.freeze([]);
  return Object.freeze([
    { layer: merged.source as string, value: merged.value },
    ...merged.shadowed.map((shadowed) => ({
      layer: shadowed.layer as string,
      value: shadowed.value,
    })),
  ]);
}

/** The merge's value of a boolean-kind key, as the two values of the switch say it. */
function unitsValueOfMerge(value: unknown): "on" | "off" | undefined {
  if (value === true || value === "on") return "on";
  if (value === false || value === "off") return "off";
  // A value that is neither is no value of the switch: the layer passes it
  // over, and the rank is left out rather than filled with a foreign value.
  return undefined;
}

/** The keys of the layer `parallel`, read from the one real merge. */
function parallelConfigurationOf(resolved: ResolvedConfiguration): ParallelLoopConfiguration {
  const units: { -readonly [K in keyof UnitsConfiguration]: UnitsConfiguration[K] } = {};
  const mergedUnits = resolved.values.get(UNITS_KEY);
  if (mergedUnits !== undefined) {
    const rank = UNITS_RANK_OF_LAYER[mergedUnits.source];
    const value = unitsValueOfMerge(mergedUnits.value);
    if (rank !== undefined && value !== undefined) units[rank] = value;
  }
  if (resolved.profile !== undefined) units.profile = resolved.profile;

  const workers: { -readonly [K in keyof WorkerCountConfiguration]: WorkerCountConfiguration[K] } =
    {};
  for (const [key, field] of [
    [WORKERS_KEY, "workers"],
    [WORKERS_MAX_KEY, "workersMax"],
  ] as const) {
    for (const offer of offersOf(resolved, key)) {
      const source = WORKERS_SOURCE_OF_LAYER[offer.layer];
      if (source === undefined || typeof offer.value !== "number") continue;
      workers[source] = { ...workers[source], [field]: offer.value };
    }
  }

  const allowDetect: {
    -readonly [K in keyof AllowDetectConfiguration]: AllowDetectConfiguration[K];
  } = {};
  for (const offer of offersOf(resolved, ALLOW_DETECT_KEY)) {
    const source = ALLOW_DETECT_SOURCE_OF_LAYER[offer.layer];
    if (source === undefined || typeof offer.value !== "boolean") continue;
    allowDetect[source] = offer.value;
  }

  const headroom = resolved.values.get("loop.parallel.quota_headroom");
  const headroomValue = Number(headroom?.value);
  return Object.freeze({
    units: Object.freeze(units),
    workers: Object.freeze(workers),
    ...(Number.isFinite(headroomValue) && headroom !== undefined
      ? { quotaHeadroomPerCent: headroomValue }
      : {}),
    allowDetect: Object.freeze(allowDetect),
  });
}

/** The key of the strategy in the catalogue. */
export const STRATEGY_KEY = "loop.strategy";

const NUMBER_KEYS: Readonly<Record<keyof Caps, string>> = Object.freeze({
  repairs: "loop.micro.caps.repairs",
  proposalMinutes: "loop.micro.caps.proposalMin",
  unitMinutes: "loop.micro.caps.unitMin",
  cyclesExtra: "loop.micro.caps.cyclesExtra",
  cyclesMin: "loop.micro.caps.cyclesMin",
  unresolvedUnits: "loop.micro.caps.unresolvedUnits",
});

/**
 * The reading of an `on, off` switch that `closingCheck` and
 * `commitBackpressureIsOn` already use: the literal `off`, a string that
 * starts with `off` (the cell of a row of the parity profile) and the boolean
 * `false` switch it off; everything else — including no value at all — keeps
 * it on, so a switch that no source holds stands at its default.
 */
function switchIsOn(value: unknown): boolean {
  if (typeof value === "string") return !value.startsWith("off");
  return value !== false;
}

/** The key of the enforced time limit of the check (feature 153, row 135). */
export const TIME_LIMIT_ENFORCE_KEY = "verification.timeLimit.enforce";

/**
 * The value of `verification.timeLimit.enforce`, read from the layers above
 * the project file (F153-FR-005): a project file may only narrow, and the
 * project file turning the enforcement off would lift the limit, so such an
 * offer is skipped and the next offer above it — or the default, on — stands.
 */
function timeLimitEnforcedOf(resolved: ResolvedConfiguration): boolean {
  for (const offer of offersOf(resolved, TIME_LIMIT_ENFORCE_KEY)) {
    if (offer.layer === "project-configuration" && !switchIsOn(offer.value)) continue;
    return switchIsOn(offer.value);
  }
  return true;
}

/** The key of the verification parallelism of the gate (feature 148, row 7). */
export const PARALLELISM_CONFIG_KEY = "verification.parallelism";

/** The ceiling of `verification.parallelism` (F148-FR-011). */
const PARALLELISM_CEILING = 4;

/**
 * The value of `verification.parallelism` (F148-FR-011): a whole number,
 * default 1, ceiling 4. The trust class is `N lo` — a rank may only narrow
 * (lower) the value a rank above it held, so a project file cannot raise a
 * value the user file set — and the effective value is therefore the LOWEST
 * whole value any source held, clamped into 1 to 4. Under the `parity`
 * profile the value is 1, exactly as the profile's own row 7 holds.
 */
function verificationParallelismOf(
  resolved: ResolvedConfiguration,
  profile: string | undefined,
): number {
  if (profile === "parity") return 1;
  // The lowest SOURCE value stands. The built-in default of the catalogue is
  // not a competing source — it is what stands when no source holds a value
  // — so the shadowed default never takes part in the lowest-wins rule.
  const held = offersOf(resolved, PARALLELISM_CONFIG_KEY)
    .filter((offer) => offer.layer !== "default")
    .map((offer) => Number(offer.value))
    .filter((value) => Number.isInteger(value));
  const lowest = held.length === 0 ? 1 : Math.min(...held);
  return Math.min(Math.max(lowest, 1), PARALLELISM_CEILING);
}

/** The key of the red gate's own budget switch (feature 153, row 139). */
export const RED_GATE_OWN_BUDGET_KEY = "verification.redGate.ownBudget";

/** The key of the size of the red gate's own budget (F153-FR-021). */
export const RED_GATE_LIMIT_KEY = "verification.redGate.limit";

/** The default of the red-gate budget (CQ-153-05, budget A). */
export const RED_GATE_LIMIT_DEFAULT = 3;

/**
 * The value of `verification.redGate.limit` (F153-FR-021): a whole number,
 * at least 1, default 3. The trust class is `N lo` — a rank may only narrow
 * (lower) the value a rank above it held — so the effective value is the
 * LOWEST whole value any source held (the built-in default of the catalogue
 * is not a competing source, as with the parallelism above). A source value
 * that is not a finite whole number ≥ 1 is refused at launch (T341), never
 * guessed or clamped; and the budget is finite under every profile — this
 * reading consults neither `SPECSTRIDE_LIMITS` nor the limits-off state, so
 * no setting makes it unbounded.
 */
function redGateLimitOf(resolved: ResolvedConfiguration): number {
  const held = offersOf(resolved, RED_GATE_LIMIT_KEY).filter(
    (offer) => offer.layer !== "default",
  );
  for (const offer of held) {
    const number = Number(offer.value);
    if (!Number.isFinite(number) || !Number.isInteger(number) || number < 1) {
      throw new Error(
        `configuration: ${RED_GATE_LIMIT_KEY} must be a whole number of at least 1 — ` +
          `refused the value ${String(offer.value)} from ${offer.layer}`,
      );
    }
  }
  return held.length === 0 ? RED_GATE_LIMIT_DEFAULT : Math.min(...held.map((o) => Number(o.value)));
}

/**
 * Resolve the loop keys of a run through the real configuration: the files
 * the loader finds (the user file of `user:config`, the project file
 * `specstride.yaml` of the workspace), the environment and the defaults of
 * the catalogue, merged through the eight ranks of F110-FR-014.
 */
export function loopConfigurationOf(input: {
  readonly home: string;
  readonly workdir: string;
  readonly environment: NodeJS.ProcessEnv;
}): LoopConfiguration {
  const files = loadConfigFiles({
    home: input.home,
    // The configuration home the ENVIRONMENT names (F110-FR-003): a run whose
    // environment sets `XDG_CONFIG_HOME` — a parity drive of the oracle among
    // them — reads its user configuration there, and that is where the
    // selection of the named profile `parity` stands.
    ...(input.environment.XDG_CONFIG_HOME === undefined
      ? {}
      : { xdgConfigHome: input.environment.XDG_CONFIG_HOME }),
    workspaceRealPath: realpathSync(input.workdir),
    startDir: input.workdir,
  });
  const resolved = resolveConfiguration({
    ...(files.user === undefined ? {} : { user: files.user }),
    ...(files.project === undefined ? {} : { project: files.project }),
    environment: input.environment,
  });
  const valueOf = (key: string): { value: unknown; source: string } => {
    const merged = resolved.values.get(key);
    return merged === undefined
      ? { value: undefined, source: "default" }
      : { value: merged.value, source: merged.source };
  };

  const strategy = valueOf(STRATEGY_KEY);
  const configured = strategy.source !== "default" && strategy.value !== undefined;
  // The two loop limits through the ALIAS TABLE (§K.8, F110-FR-020): the
  // as-is variables `SPECSTRIDE_MAX_ITER` and `SPECSTRIDE_MAX_REJECTS` are
  // the rank-4 aliases of `loop.maxIter` (F103-FR-003) and `loop.maxRejects`
  // (F101-FR-014), so a run driven by the baseline's variable names — a
  // fixture of the oracle among them — holds the limits the baseline held.
  // The alias table is a reading of the merge, not a second one: it is why
  // this merge carries `aliasTable: true` and only these two keys are read
  // out of it.
  const withAliases = resolveConfiguration({
    ...(files.user === undefined ? {} : { user: files.user }),
    ...(files.project === undefined ? {} : { project: files.project }),
    environment: input.environment,
    aliasTable: true,
  });
  const limitOf = (key: string, fallback: number): number => {
    const number = Number(withAliases.values.get(key)?.value);
    return Number.isSafeInteger(number) && number > 0 ? number : fallback;
  };
  const caps = capsFor(
    Object.fromEntries(
      (Object.keys(NUMBER_KEYS) as (keyof Caps)[]).map((name) => {
        const read = valueOf(NUMBER_KEYS[name]);
        const number = Number(read.value);
        return [name, Number.isFinite(number) ? number : undefined];
      }),
    ),
  );
  return Object.freeze({
    profile: resolved.profile,
    strategy: strategy.value === "classic" ? ("classic" as const) : ("micro" as const),
    // The catalogue types the switch `on, off`, which the merge reads as a
    // boolean; both spellings of "off" switch it off.
    closingCheck: (() => {
      const read = valueOf("loop.micro.closing_check").value;
      return read !== "off" && read !== false;
    })(),
    checkMin: Number(valueOf("loop.micro.caps.checkMin").value) || 5,
    caps,
    source: configured ? ("configured" as const) : ("default" as const),
    configuredValue: configured ? strategy.value : undefined,
    backpressureValue: valueOf("commit.backpressure").value,
    timeLimitEnforced: timeLimitEnforcedOf(resolved),
    closingCheckSkipsWhenEqualToGate: switchIsOn(
      valueOf("loop.micro.closingCheck.skipWhenEqualToGate").value,
    ),
    innerChecksAreScoped: switchIsOn(valueOf("verification.inner.scoped").value),
    criticEvidenceIsPerTask: switchIsOn(valueOf("critic.evidence.perTask").value),
    // F153-FR-059 — the pass handoff is on by default and always off under
    // the `parity` profile, whatever a source holds: every pass is fresh.
    ledgerHandoff:
      resolved.profile !== "parity" && switchIsOn(valueOf("carry.ledger_handoff").value),
    handoffMaxBytes: (() => {
      const number = Number(valueOf("carry.handoffMaxBytes").value);
      return Number.isSafeInteger(number) && number > 0 ? number : MAX_BYTES_DEFAULT;
    })(),
    verificationParallelism: verificationParallelismOf(resolved, resolved.profile),
    // Row 139 of annex X §X.7 (F153-FR-020): on by default, OFF under the
    // `parity` profile whatever a source holds — under parity a red gate is
    // a rejection with code 10 that counts toward the reject limit.
    redGateOwnBudget:
      resolved.profile !== "parity" && switchIsOn(valueOf(RED_GATE_OWN_BUDGET_KEY).value),
    redGateLimit: redGateLimitOf(resolved),
    // Row 59 of annex X §X.7 (`loop.noProgressStructured`): on by default and
    // OFF under the `parity` profile (defect D-44 kept — the baseline has no
    // structured no-progress measurement, so under parity the breaker is not
    // evaluated; F103-FR-018).
    noProgressStructured: switchIsOn(valueOf(NO_PROGRESS_STRUCTURED_KEY).value),
    maxIter: limitOf("loop.maxIter", REQUEST_DEFAULTS.passLimit),
    maxRejects: limitOf("loop.maxRejects", REJECT_LIMIT_DEFAULT),
    parallel: parallelConfigurationOf(resolved),
  });
}
