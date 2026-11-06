/**
 * T140 — the sample implementation of EP-13, the lock and liveness provider,
 * outside the core, registered from the test tree (annex A, §A.4,
 * F100-FR-018; annex X, §X.10, F100-FR-222).
 *
 * The sample provider that keeps locks in memory, which §F.5 "Proving test"
 * names. A lock never exists without its owner record, reclaim is atomic
 * (one replacement of the entry), and a foreign owner is never reclaimed.
 */
import type {
  AcquireResult,
  HandDownToken,
  LockScope,
  ProbeResult,
  ReclaimResult,
} from "@specstride/contracts/ep/lock";
import type { OwnerRecord } from "@specstride/contracts/records/owner-record";
import type { Lease } from "@specstride/contracts/records/lease";
import type { Implementation } from "../../conformance/frame.ts";

/**
 * One owned child of a run, as the process registry would hold it: the
 * entries of class `owned` that row P5 of the probe decision table asks
 * about. An `adoptable` entry is never one of these, which is
 * F122-FR-017's *a process of class `adoptable` MUST never cause this
 * result*.
 */
export type OwnedChild = { readonly procId: string; readonly pid: number; alive: boolean };

type Held = {
  readonly owner: OwnerRecord;
  readonly lease: Lease;
  /** Whether the owner PROCESS answers; the liveness of §F.5. */
  alive: boolean;
  /** Open entries of class `owned` of the run that holds the lock. */
  readonly children: OwnedChild[];
};

const locks = new Map<string, Held>();
const tokens = new Map<HandDownToken, string>();
let next = 0;

/** The host name of this provider; another one is a foreign owner. */
export const HOST = "sample-host" as const;

/** The boot this provider believes it is in. A case may change it. */
export const FIRST_BOOT = "boot-1" as const;
let boot: string = FIRST_BOOT;

function keyOf(scope: LockScope): string {
  return `${scope.workspaceId}\u0000${scope.path}`;
}

/** Empty the memory of the provider, for a fresh case. */
export function reset(): void {
  locks.clear();
  tokens.clear();
  next = 0;
  boot = FIRST_BOOT;
}

/** The boot identity this provider is in now. */
export function currentBoot(): string {
  return boot;
}

/**
 * The machine rebooted. F122-FR-013: *an owner whose boot identity differs
 * from the present boot MUST count as dead, whatever process now has its
 * pid.* After this, a record of the old boot is dead even while a process of
 * its pid answers — which is the case "a reused pid after a changed boot
 * identity".
 */
export function changeBootIdentity(identity = "boot-2"): void {
  boot = identity;
}

/** Add an open entry of class `owned` to the run that holds the lock. */
export function addOwnedChild(scope: LockScope, child: Omit<OwnedChild, "alive">): void {
  locks.get(keyOf(scope))?.children.push({ ...child, alive: true });
}

/** Close every open entry of class `owned`: the survivors are gone. */
export function endOwnedChildren(scope: LockScope): void {
  for (const child of locks.get(keyOf(scope))?.children ?? []) child.alive = false;
}

/** The owner record a case plants, with the boot it was made in. */
export function ownerIn(owner: OwnerRecord, bootId: string = boot): OwnerRecord {
  return Object.freeze({ ...owner, bootId }) as OwnerRecord;
}

/** Whether the owner of a held lock counts as dead (F122-FR-013). */
function ownerIsDead(held: Held): boolean {
  const recorded = (held.owner as unknown as { bootId?: string }).bootId;
  // A record that carries no boot identity cannot be compared with the
  // present boot, so nothing may be concluded from it and the liveness alone
  // decides. An absence is never a difference.
  if (recorded !== undefined && recorded !== boot) return true;
  return !held.alive;
}

export const operations = Object.freeze({
  acquire(scope: LockScope, owner: OwnerRecord): Promise<AcquireResult> {
    const key = keyOf(scope);
    const held = locks.get(key);
    if (held !== undefined && held.alive) {
      return Promise.resolve(
        Object.freeze({
          acquired: false as const,
          conflict: "conflict" as const,
          holder: held.owner,
        }),
      );
    }
    const lease: Lease = {
      schema: "specstride.lease/1",
      leaseId: `lease-${++next}`,
      workspaceId: scope.workspaceId,
      owner: owner as unknown as Record<string, unknown>,
      acquiredAt: "2026-10-01T00:00:00.000Z",
      heartbeatAt: "2026-10-01T00:00:00.000Z",
      ttlMs: 30_000,
    } as unknown as Lease;
    locks.set(key, { owner, lease, alive: true, children: [] });
    return Promise.resolve(Object.freeze({ acquired: true as const, lease }));
  },
  heartbeat(_lease: Lease): Promise<void> {
    return Promise.resolve();
  },
  release(lease: Lease): Promise<void> {
    for (const [key, held] of locks) if (held.lease === lease) locks.delete(key);
    return Promise.resolve();
  },
  probe(scope: LockScope): Promise<ProbeResult> {
    // The six results of §F.5, in the order of the decision table that
    // F122-FR-013 fixes: free, unknown, held-foreign, held-live,
    // owner-dead-group-alive, stale-owner-dead.
    const held = locks.get(keyOf(scope));
    if (held === undefined) return Promise.resolve("free" as ProbeResult);
    const record = held.owner as unknown as { host?: string; pid?: unknown };
    if (record.pid === undefined) return Promise.resolve("unknown" as ProbeResult);
    if (record.host !== undefined && record.host !== HOST) {
      return Promise.resolve("held-foreign" as ProbeResult);
    }
    if (!ownerIsDead(held)) return Promise.resolve("held-live" as ProbeResult);
    // The owner is dead. An open entry of class `owned` that still lives
    // keeps the lock held and names the survivors (F122-FR-017).
    if (held.children.some((child) => child.alive)) {
      return Promise.resolve("owner-dead-group-alive" as ProbeResult);
    }
    return Promise.resolve("stale-owner-dead" as ProbeResult);
  },
  reclaim(scope: LockScope): Promise<ReclaimResult> {
    const key = keyOf(scope);
    const held = locks.get(key);
    if (held === undefined)
      return Promise.resolve(
        Object.freeze({ reclaimed: false as const, reason: "lost-race" as const }),
      );
    const host = (held.owner as unknown as { host?: string }).host;
    if (host !== undefined && host !== HOST) {
      return Promise.resolve(
        Object.freeze({ reclaimed: false as const, reason: "foreign-owner" as const }),
      );
    }
    // Only `stale-owner-dead` opens the way (F122-FR-015): a live owner, and
    // an owner whose group still lives, are both refused.
    if (!ownerIsDead(held) || held.children.some((child) => child.alive)) {
      return Promise.resolve(
        Object.freeze({ reclaimed: false as const, reason: "lost-race" as const }),
      );
    }
    // F122-FR-015 — *a reclaimed lock MUST carry the owner record of the
    // WINNER from its first moment*, so the stale record is replaced and
    // never carried forward: a lock that kept the dead owner's boot identity
    // would probe `stale-owner-dead` the instant after it was reclaimed.
    const reclaimedOwner = ownerIn(
      {
        ...(held.owner as unknown as Record<string, unknown>),
        launchId: `launch-reclaimed-${next + 1}`,
      } as unknown as OwnerRecord,
      boot,
    );
    // Atomic: the entry is replaced, never removed and created again.
    const lease = {
      ...(held.lease as unknown as Record<string, unknown>),
      leaseId: `lease-${++next}`,
      owner: reclaimedOwner as unknown as Record<string, unknown>,
    } as unknown as Lease;
    locks.set(key, { owner: reclaimedOwner, lease, alive: true, children: [] });
    return Promise.resolve(Object.freeze({ reclaimed: true as const, lease }));
  },
  handDown(lease: Lease): HandDownToken {
    const token = `token-${++next}`;
    for (const [key, held] of locks) if (held.lease === lease) tokens.set(token, key);
    return token;
  },
  verify(token: HandDownToken): Promise<boolean> {
    const key = tokens.get(token);
    if (key === undefined) return Promise.resolve(false);
    const held = locks.get(key);
    return Promise.resolve(held !== undefined && !ownerIsDead(held));
  },
});

/** Let a case kill the owner without warning, as §F.5 "Proving test" asks. */
export function killOwner(scope: LockScope): void {
  const held = locks.get(keyOf(scope));
  if (held !== undefined) held.alive = false;
}

/** The owner record of the lock a case holds, for an assertion about it. */
export function holderOf(scope: LockScope): OwnerRecord | undefined {
  return locks.get(keyOf(scope))?.owner;
}

/** How many entries of class `owned` of the run still live. */
export function survivorsOf(scope: LockScope): readonly OwnedChild[] {
  return Object.freeze((locks.get(keyOf(scope))?.children ?? []).filter((c) => c.alive));
}

export const implementation: Implementation = Object.freeze({
  ep: "EP-13",
  pointId: "specstride.lock/1",
  id: "sample-lock-in-memory",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
