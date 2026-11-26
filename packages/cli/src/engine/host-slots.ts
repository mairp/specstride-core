/**
 * THE HOST SLOT SEAM OF THE ENGINE (feature 154, US4 — T095, T097).
 *
 * The composition root builds ONE `RunHostSlots` per engine start from:
 * - the `host.limits` switch, read the way `run-feature.temp-root.ts` reads
 *   the configuration files (off by default, off under `parity`);
 * - the host bounds of the start's environment. The bound keys
 *   (`host.checks.concurrent`, `host.sessions.<account>`,
 *   `host.resources.<name>.capacity`) are not rows of the configuration
 *   catalogue, so a configuration file cannot carry them; they arrive as
 *   environment variables of the start:
 *
 *   - `SPECSTRIDE_HOST_CHECKS_CONCURRENT=<n>`
 *   - `SPECSTRIDE_HOST_SESSIONS_<ACCOUNT>=<n>`  (rule `sessions/<account>`)
 *   - `SPECSTRIDE_HOST_RESOURCES_<NAME>=<n>`    (rule `resources/<name>`)
 *
 * A value that is not a positive integer is refused (the bound is dropped,
 * the refusal recorded). Where `host.limits` is off, or the store cannot be
 * built, `take` is null: nothing is gated, exactly as before this module
 * existed (F154-FR-004 — an unreadable store never errors, it answers
 * `unbounded` and the caller proceeds without the bound).
 */
import { createSlotStore, type HostSlots, type SlotAdmission } from "../../../runtime/src/limits/slot-store.ts";
import { userStateRoot } from "@specstride/contracts/ids/roots";

/** A release of a taken slot; `null` where nothing was gated. */
export type HostSlotRelease = (() => Promise<void>) | null;

/** The predicate-read bounds of one engine start, keyed by slot rule. */
export type HostBoundsOfTheStart = Readonly<Record<string, number>>;

const BOUND_PATTERN =
  /^SPECSTRIDE_HOST_(CHECKS_CONCURRENT|(?:SESSIONS|RESOURCES)_([A-Z0-9_]+))$/;

/** The slot rule an environment variable names, and its value. */
function boundOfTheVariable(name: string, value: string): { rule: string; width: number } | { refusal: string } {
  const match = BOUND_PATTERN.exec(name);
  if (match === null) return { refusal: `the environment variable \`${name}\` names no host bound` };
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { refusal: `the host bound \`${name}=${value}\` is not a positive integer: it is refused` };
  }
  const [kind, rest] = [match[1]!, match[2] ?? ""];
  const rule =
    kind === "CHECKS_CONCURRENT"
      ? "checks"
      : kind.startsWith("SESSIONS_")
        ? `sessions/${rest.toLowerCase()}`
        : `resources/${rest.toLowerCase()}`;
  return { rule, width: parsed };
}

/** The bounds of one start's environment, with the refusals of the bad values. */
export function hostBoundsFromEnvironment(
  env: Readonly<Record<string, string | undefined>>,
): { bounds: HostBoundsOfTheStart; refusals: readonly string[] } {
  const bounds: Record<string, number> = {};
  const refusals: string[] = [];
  for (const [name, value] of Object.entries(env)) {
    // `SPECSTRIDE_HOST_LIMITS` is the catalogue's environment name of the
    // SWITCH, not a bound: it is read by the configuration resolution, and
    // here it is passed over, never refused.
    if (value === undefined || name === "SPECSTRIDE_HOST_LIMITS") continue;
    if (!name.startsWith("SPECSTRIDE_HOST_")) continue;
    const read = boundOfTheVariable(name, value);
    if ("refusal" in read) refusals.push(read.refusal);
    else bounds[read.rule] = read.width;
  }
  return Object.freeze({ bounds: Object.freeze(bounds), refusals: Object.freeze(refusals) });
}

/** What one engine start carries of the host slots. */
export type RunHostSlots = {
  /** The store, `null` where `host.limits` is off or the store could not be built. */
  readonly store: HostSlots | null;
  readonly bounds: HostBoundsOfTheStart;
  readonly refusals: readonly string[];
  /**
   * Take a slot of the bound, waiting (with jitter, never busy-spinning)
   * while the bound is full; answers the release, or `null` where the run
   * proceeds without the bound (limits off, store unreadable).
   */
  readonly take: (bound: string, emit: (admission: SlotAdmission) => void) => Promise<HostSlotRelease>;
};

/** How long one wait between admission polls lasts, before the jitter. */
const WAIT_MS = 50;
const JITTER_MS = 25;

/**
 * The host slots of one engine start. `limitsOn` reads the resolved
 * `host.limits` switch (`true` where the start is not under `parity` and the
 * switch is on); `env` carries the bounds.
 */
export function makeRunHostSlots(input: {
  home: string;
  workdir: string;
  env: Readonly<Record<string, string | undefined>>;
  limitsOn: boolean;
  account?: string | undefined;
}): RunHostSlots {
  const { bounds, refusals } = hostBoundsFromEnvironment(input.env);
  if (!input.limitsOn) {
    return Object.freeze({
      store: null,
      bounds,
      refusals,
      take: async () => null,
    });
  }
  let store: HostSlots | null = null;
  try {
    store = createSlotStore({
      userStateRoot: userStateRoot({
        home: input.home,
        ...(input.env.XDG_STATE_HOME === undefined
          ? {}
          : { xdgStateHome: input.env.XDG_STATE_HOME }),
        workspaceRealPath: input.workdir,
        workspaceId: "",
      }),
      workspaceRealPath: input.workdir,
      bounds,
      runtimeDirectory: input.home,
    });
  } catch {
    store = null;
  }
  if (store === null) {
    return Object.freeze({ store: null, bounds, refusals, take: async () => null });
  }
  const take = async (bound: string, emit: (admission: SlotAdmission) => void): Promise<HostSlotRelease> => {
    for (;;) {
      const admission = await store!.admit(bound);
      if (admission.verdict === "unbounded") {
        emit(admission);
        return null; // F154-FR-004 — proceed without the bound.
      }
      if (admission.verdict === "take" || admission.verdict === "reclaim") {
        // A `reclaim` verdict names the dead slot: the one atomic rename of
        // `../lock/reclaim.ts` takes it (F122-FR-015), never a plain take.
        const acquired =
          admission.verdict === "reclaim" && admission.slot !== undefined
            ? await store!.reclaim(bound, admission.slot)
            : await store!.acquire(bound);
        emit(
          acquired.acquired
            ? { ...admission, slot: acquired.slot }
            : {
                ...admission,
                verdict: "wait",
                reason: "the slot was taken between the admission and the acquire",
              },
        );
        if (!acquired.acquired) continue;
        return async () => {
          await store!.release(bound);
        };
      }
      // `wait` — a pause with jitter, never a busy spin, and the admission
      // event says so (F154-FR-039).
      emit(admission);
      await new Promise((resolve) => setTimeout(resolve, WAIT_MS + Math.floor(Math.random() * JITTER_MS)));
    }
  };
  return Object.freeze({ store, bounds, refusals, take });
}
