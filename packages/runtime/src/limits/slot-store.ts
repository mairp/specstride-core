/**
 * T090 — the slot store of feature 154 (F154-FR-039, F154-FR-044): N
 * directory locks of the shipped provider of feature 122, one per slot of a
 * named bound, laid out under `<user-state>/slots/<bound>/<slot>/`.
 *
 * Each slot IS an ordinary workspace lock of `../lock/directory-lock.ts`
 * (`createDirectoryLock`, :266) over its own control root, so everything the
 * lock already guarantees holds here too: the owner record is built by
 * `ownerRecordFor` (`../lock/directory-lock.ts` :514) and written before the
 * lock is visible (the one atomic rename of D-1), a probe answers from the
 * decision table of F122-FR-013, and a dead owner's slot is reclaimable by
 * the one atomic rename of `../lock/reclaim.ts`.
 *
 * F154-FR-004 — nothing here throws because the store said no. A bound that
 * is not configured, a root that cannot be read, a slot that cannot be
 * probed: each answers `unbounded` with its reason, and the caller proceeds
 * without the bound. The store never turns a missing bound into an error.
 */

import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { mintRunToken } from "../procs/run-token.ts";
import {
  createDirectoryLock,
  type AcquireInput,
  type DirectoryAcquireResult,
  type DirectoryLock,
} from "../lock/directory-lock.ts";
import { probeLock, type ProbeDependencies } from "../lock/probe.ts";
import type { LockPlace } from "../lock/paths.ts";
import { buildOwnerRecord, type BuiltOwnerRecord } from "../lock/owner-record.ts";
import type { Lease } from "@specstride/contracts/records/lease";

/** The requirement this module carries. */
export const SLOT_STORE_REQUIREMENTS = ["F154-FR-039", "F154-FR-044", "F154-FR-004"] as const;

/** The directory of one bound, under the user-state root. */
export function slotsRootOf(userStateRoot: string, bound: string): string {
  return join(userStateRoot, "slots", bound);
}

/** The control root of one slot of a bound; the lock lives at `<slot>/lock/`. */
export function slotControlRootOf(userStateRoot: string, bound: string, slot: number): string {
  return join(slotsRootOf(userStateRoot, bound), String(slot));
}

/** The five statuses a slot probe answers, in the vocabulary of the hint. */
export const SLOT_STATUSES = [
  "free",
  "held-live",
  "held-foreign",
  "stale-owner-dead",
  "unknown",
] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

/** What one slot answered. */
export type SlotProbe = {
  readonly slot: number;
  readonly status: SlotStatus;
  /** The row of the probe decision table that decided, for a doctor finding. */
  readonly row: string;
};

/** What `probe(bound)` answers: the slots, or the reading that failed. */
export type SlotStoreProbe =
  | { readonly readable: true; readonly bound: string; readonly width: number; readonly probes: readonly SlotProbe[] }
  | { readonly readable: false; readonly bound: string; readonly reason: string };

/** The verdict of one admission attempt (F154-FR-039). */
export const SLOT_ADMISSION_VERDICTS = ["take", "reclaim", "wait", "unbounded"] as const;
export type SlotAdmissionVerdict = (typeof SLOT_ADMISSION_VERDICTS)[number];

/** What an admission attempt answers; the shape of a `host.slot.admission` event. */
export type SlotAdmission = {
  readonly rule: string;
  readonly verdict: SlotAdmissionVerdict;
  readonly bound: number;
  /** The slot taken or to be reclaimed, where there is one. */
  readonly slot?: number;
  /** Why, on `wait` and on `unbounded`. */
  readonly reason?: string;
};

/**
 * The admission over probes already read (F154-FR-039, F154-FR-044). Probes
 * that could not be read at all (the store is unreadable) come in as `null`
 * and give `unbounded` — never an error (F154-FR-004).
 */
export function slotAdmissionOf(
  rule: string,
  bound: number,
  probes: readonly SlotProbe[] | null,
  whyUnreadable?: string,
): SlotAdmission {
  if (probes === null) {
    return Object.freeze({
      rule,
      verdict: "unbounded",
      bound,
      reason: whyUnreadable ?? "the slot store could not be read",
    });
  }
  const free = probes.find((p) => p.status === "free");
  if (free !== undefined) return Object.freeze({ rule, verdict: "take", bound, slot: free.slot });
  const stale = probes.find((p) => p.status === "stale-owner-dead");
  if (stale !== undefined) {
    return Object.freeze({ rule, verdict: "reclaim", bound, slot: stale.slot });
  }
  return Object.freeze({
    rule,
    verdict: "wait",
    bound,
    reason: `all ${probes.length} slot${probes.length === 1 ? "" : "s"} are held`,
  });
}

/** What `acquire` answers. */
export type SlotAcquireResult =
  | {
      readonly acquired: true;
      readonly bound: string;
      readonly slot: number;
      /** The owner record the lock wrote, as `ownerRecordFor` built it. */
      readonly owner: BuiltOwnerRecord;
      /** The take or reclaim this was, for the admission event. */
      readonly verdict: "take" | "reclaim";
    }
  | {
      readonly acquired: false;
      readonly bound: string;
      readonly verdict: "wait" | "unbounded";
      readonly reason: string;
    };

/** What a caller must know to build one store. */
export type SlotStoreOptions = {
  /** The per-user state root; the slots live at `<user-state>/slots/`. */
  readonly userStateRoot: string;
  /** The real path of the workspace, so lock identities never collide. */
  readonly workspaceRealPath: string;
  /** The configured bounds and their widths (`{ checks: 1, "sessions/x": 2 }`). */
  readonly bounds: Readonly<Record<string, number>>;
  /** The per-user runtime directory of the liveness endpoints (D-3). */
  readonly runtimeDirectory?: string | undefined;
  /** A clock, so that a test pins the times of the leases. */
  readonly now?: (() => Date) | undefined;
  /** What the probes read; a test may pin any of it. */
  readonly probeDependencies?: ProbeDependencies | undefined;
};

/** The input of an acquire, defaulted so a caller names only what differs. */
export type SlotAcquireInput = {
  readonly runId?: string | undefined;
  readonly launchId?: string | undefined;
  readonly launchNonce?: string | undefined;
};

/**
 * The facade over the slots of the configured bounds. One store per process
 * per user-state root; the liveness endpoints are named by process id and
 * instance, so two stores of one process never collide.
 */
export type HostSlots = {
  /** Take a free slot of the bound, or answer why not. Never throws. */
  acquire(bound: string, input?: SlotAcquireInput): Promise<SlotAcquireResult>;
  /** Probe every slot of the bound; unreadable is an answer, not an error. */
  probe(bound: string): Promise<SlotStoreProbe>;
  /** Release the slot this store holds for the bound; idempotent. */
  release(bound: string): Promise<void>;
  /** Reclaim one dead owner's slot by the one atomic rename, then hold it. */
  reclaim(bound: string, slot: number, input?: SlotAcquireInput): Promise<SlotAcquireResult>;
  /** Probe and decide in one call: take, reclaim, wait or unbounded. */
  admit(bound: string): Promise<SlotAdmission>;
  /** The width configured for the bound, or `undefined` when none is. */
  widthOf(bound: string): number | undefined;
};

/** Build the store over the configured bounds. */
export function createSlotStore(options: SlotStoreOptions): HostSlots {
  const locks = new Map<string, DirectoryLock>();
  const held = new Map<string, { slot: number; lease: Lease }>();

  const widthOf = (bound: string): number | undefined => {
    const width = options.bounds[bound];
    return typeof width === "number" && Number.isInteger(width) && width > 0 ? width : undefined;
  };

  const lockOf = (bound: string, slot: number): DirectoryLock => {
    const key = `${bound}/${slot}`;
    const known = locks.get(key);
    if (known !== undefined) return known;
    const place: LockPlace = {
      controlRoot: slotControlRootOf(options.userStateRoot, bound, slot),
      workspaceRealPath: options.workspaceRealPath,
    };
    const lock = createDirectoryLock({
      place,
      runtimeDirectory: options.runtimeDirectory,
      ...(options.now === undefined ? {} : { now: options.now }),
      ...(options.probeDependencies === undefined ? {} : { probeDependencies: options.probeDependencies }),
    });
    locks.set(key, lock);
    return lock;
  };

  const inputOf = (input?: SlotAcquireInput): AcquireInput => ({
    runId: input?.runId ?? "run-slots",
    launchId: input?.launchId ?? "launch-slots",
    launchNonce: input?.launchNonce ?? `nonce-${Math.random().toString(36).slice(2)}`,
  });

  const ownerWith = (launchId: string): BuiltOwnerRecord =>
    buildOwnerRecord({ launchId, runTokenHash: mintRunToken().hash });

  const take = async (
    bound: string,
    slot: number,
    owner: BuiltOwnerRecord,
    input: AcquireInput,
    verdict: "take" | "reclaim",
  ): Promise<SlotAcquireResult> => {
    const lock = lockOf(bound, slot);
    const result: DirectoryAcquireResult = await lock.acquireHere(owner, input);
    if (!result.acquired) {
      return Object.freeze({
        acquired: false,
        bound,
        verdict: "wait",
        reason: result.error === "unknown" ? `the store failed: ${result.detail}` : result.detail,
      });
    }
    held.set(bound, { slot, lease: result.lease });
    return Object.freeze({
      acquired: true,
      bound,
      slot,
      owner: result.owner as BuiltOwnerRecord,
      verdict,
    });
  };

  return Object.freeze({
    widthOf,

    async acquire(bound: string, input?: SlotAcquireInput): Promise<SlotAcquireResult> {
      const width = widthOf(bound);
      if (width === undefined) {
        return Object.freeze({
          acquired: false,
          bound,
          verdict: "unbounded",
          reason: `no bound is configured under the rule \`${bound}\``,
        });
      }
      const launchId = input?.launchId ?? "launch-slots";
      const owner = ownerWith(launchId);
      const full = inputOf(input);
      // The bound's directory is made before any lock is built, so the
      // layout exists even where every slot is already held (F154-FR-044).
      try {
        // F154-FR-044 — the bound's layout exists from the first acquire:
        // the bound directory AND every slot control root of the width, so
        // the N slots are visible before any is taken. The exclusion is the
        // lock directory `<slot>/lock/` (the rename of D-1), never the
        // control root, so an empty slot directory is harmless.
        mkdirSync(slotsRootOf(options.userStateRoot, bound), { recursive: true });
        for (let slot = 0; slot < width; slot += 1) {
          mkdirSync(slotControlRootOf(options.userStateRoot, bound, slot), { recursive: true });
        }
      } catch (error) {
        return Object.freeze({
          acquired: false,
          bound,
          verdict: "unbounded",
          reason: `the slot store could not be read or made: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
      for (let slot = 0; slot < width; slot += 1) {
        const attempt = await take(bound, slot, owner, full, "take");
        if (attempt.acquired || attempt.verdict === "unbounded") return attempt;
      }
      return Object.freeze({
        acquired: false,
        bound,
        verdict: "wait",
        reason: `all ${width} slots of \`${bound}\` are held`,
      });
    },

    async reclaim(bound: string, slot: number, input?: SlotAcquireInput): Promise<SlotAcquireResult> {
      const width = widthOf(bound);
      if (width === undefined || slot < 0 || slot >= width) {
        return Object.freeze({
          acquired: false,
          bound,
          verdict: "unbounded",
          reason:
            width === undefined
              ? `no bound is configured under the rule \`${bound}\``
              : `the slot ${slot} is outside the bound \`${bound}\` of width ${width}`,
        });
      }
      const launchId = input?.launchId ?? "launch-slots";
      const owner = ownerWith(launchId);
      // T092 (F154-FR-044) — RECLAIM ONLY A DEAD OWNER'S SLOT: the probe
      // decides first, and only `stale-owner-dead` opens the way (the same
      // rule `reclaimByOneAtomicRename` enforces at the lock, which is the
      // second gate). A live owner's slot is never removed; `held-foreign`
      // and `unknown` count as held and answer `wait`.
      const probed = await this.probe(bound);
      if (!probed.readable) {
        return Object.freeze({
          acquired: false,
          bound,
          verdict: "wait",
          reason: `the slot store could not be read: ${probed.reason}`,
        });
      }
      const status = probed.probes.find((probe) => probe.slot === slot)?.status;
      if (status !== undefined && status !== "stale-owner-dead") {
        return Object.freeze({
          acquired: false,
          bound,
          verdict: "wait",
          reason: `slot ${String(slot)} is not reclaimable: ${status}`,
        });
      }
      const lock = lockOf(bound, slot);
      const outcome = await lock.reclaimHere(owner, inputOf(input));
      if (!outcome.reclaimed) {
        return Object.freeze({
          acquired: false,
          bound,
          verdict: "wait",
          reason: outcome.detail,
        });
      }
      held.set(bound, { slot, lease: outcome.lease });
      return Object.freeze({
        acquired: true,
        bound,
        slot,
        // The reclaimed lock carries the winner's record, as D-4 asks: the
        // record `reclaimHere` acquired with, the one built above.
        owner,
        verdict: "reclaim",
      });
    },

    async probe(bound: string): Promise<SlotStoreProbe> {
      const width = widthOf(bound);
      if (width === undefined) {
        return Object.freeze({
          readable: false,
          bound,
          reason: `no bound is configured under the rule \`${bound}\``,
        });
      }
      // F154-FR-004 — a bound directory that exists but is not a directory
      // (a full disk left a file there, say) makes the STORE unreadable:
      // the answer is `unbounded` with the reason, never an error. A bound
      // that does not exist yet is a fresh store, and its slots are free.
      const root = slotsRootOf(options.userStateRoot, bound);
      try {
        if (existsSync(root) && !statSync(root).isDirectory()) {
          return Object.freeze({
            readable: false,
            bound,
            reason: `the slot store could not be read: \`${root}\` is not a directory`,
          });
        }
      } catch {
        /* the existence check itself failed: fall through to the per-slot probe */
      }
      const probes: SlotProbe[] = [];
      for (let slot = 0; slot < width; slot += 1) {
        const lock = lockOf(bound, slot);
        // F154-FR-004 — a slot that cannot be probed makes the STORE
        // unreadable, which is an answer (`unbounded`), never an error:
        // the caller proceeds without the bound, with the reason recorded.
        let outcome: Awaited<ReturnType<DirectoryLock["probeHere"]>>;
        try {
          outcome = await lock.probeHere();
        } catch (error) {
          return Object.freeze({
            readable: false,
            bound,
            reason: `the slot store could not be read: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });
        }
        probes.push(
          Object.freeze({
            slot,
            status: statusOf(outcome.result),
            row: outcome.row,
          }),
        );
      }
      return Object.freeze({ readable: true, bound, width, probes: Object.freeze(probes) });
    },

    async release(bound: string): Promise<void> {
      const holding = held.get(bound);
      if (holding === undefined) return; // Idempotent: nothing held, nothing done.
      held.delete(bound);
      const lock = locks.get(`${bound}/${holding.slot}`);
      if (lock === undefined) return;
      await lock.release(holding.lease);
    },

    async admit(bound: string): Promise<SlotAdmission> {
      const width = widthOf(bound);
      if (width === undefined) {
        return slotAdmissionOf(bound, 0, null, `no bound is configured under the rule \`${bound}\``);
      }
      const probed = await this.probe(bound);
      if (!probed.readable) return slotAdmissionOf(bound, width, null, probed.reason);
      return slotAdmissionOf(bound, width, probed.probes);
    },
  });
}

/** The store's status for a probe result of the decision table (F154-FR-044). */
function statusOf(result: string): SlotStatus {
  switch (result) {
    case "free":
      return "free";
    case "held-live":
      return "held-live";
    case "held-foreign":
      return "held-foreign";
    case "stale-owner-dead":
    case "owner-dead-group-alive":
      return "stale-owner-dead";
    default:
      return "unknown";
  }
}
