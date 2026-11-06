/**
 * T035 — the stand-in for the runtime root that the sample detach strategy
 * starts (annex F, §F.6 "Proving test").
 *
 * It is the CHILD of the conformance suite's two cases: the process that must
 * still be alive after the process that started it has ended. It does the one
 * thing step 3 of the handshake does that the suite can read — *writes the
 * lease with the launch nonce* (annex B, §B.8) — and then stays alive until
 * something ends it.
 *
 * It holds NO clean-up handler, on purpose: the two cases are about what
 * survives when nothing of the product runs, so a handler here would be the
 * thing under test lending a hand.
 */
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { SCHEMA_ID as LEASE_SCHEMA_ID } from "@specstride/contracts/records/lease";

/** This file, so that the strategy can start it. */
export const SAMPLE_ROOT_ENTRY = fileURLToPath(import.meta.url);

/** The grace the stand-in's lease is written with, in seconds. */
export const SAMPLE_GRACE_SECONDS = 300 as const;

/** The interval it records, in seconds. */
export const SAMPLE_HEARTBEAT_SECONDS = 10 as const;

/** The lease of §B.8, as the stand-in writes it. */
export function sampleLease(input: {
  readonly runId: string;
  readonly launchId: string;
  readonly launchNonce: string;
  readonly pid: number;
  readonly now: Date;
}): Record<string, unknown> {
  const heartbeatAt = input.now.toISOString();
  return {
    schema: LEASE_SCHEMA_ID,
    runId: input.runId,
    launchId: input.launchId,
    launchNonce: input.launchNonce,
    owner: {
      pid: input.pid,
      processGroup: input.pid,
      startTime: heartbeatAt,
      bootId: "sample-boot",
      hostName: "sample-host",
      pidNamespace: null,
      launchId: input.launchId,
      runTokenHash: "sample-run-token-hash",
    },
    lockProvider: "sample.detach-root/1",
    heartbeatAt,
    heartbeatEverySeconds: SAMPLE_HEARTBEAT_SECONDS,
    // §B.8 — heartbeat plus grace.
    validUntil: new Date(input.now.getTime() + SAMPLE_GRACE_SECONDS * 1_000).toISOString(),
    leaseTokenHash: "sample-lease-token-hash",
  };
}

function flag(argv: readonly string[], name: string): string {
  const at = argv.indexOf(`--${name}`);
  const value = at === -1 ? undefined : argv[at + 1];
  if (value === undefined) throw new Error(`the sample root needs --${name}`);
  return value;
}

function runAsTheRoot(argv: readonly string[]): void {
  const leaseFile = flag(argv, "lease");
  mkdirSync(dirname(leaseFile), { recursive: true, mode: 0o700 });
  const lease = sampleLease({
    runId: flag(argv, "run"),
    launchId: flag(argv, "launch"),
    launchNonce: flag(argv, "nonce"),
    pid: process.pid,
    now: new Date(),
  });
  // Written to a temporary name and renamed, so a reader never sees half of it.
  const temporary = `${leaseFile}.writing`;
  writeFileSync(temporary, JSON.stringify(lease, null, 2) + "\n", { mode: 0o600 });
  renameSync(temporary, leaseFile);
  process.stdout.write(`sample-root: the lease of ${String(lease.launchId)} is written\n`);
  // Alive, and holding nothing of the host: no pipe, no parent that waits.
  setInterval(() => {}, 60_000);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === SAMPLE_ROOT_ENTRY) {
  runAsTheRoot(process.argv.slice(2));
}
