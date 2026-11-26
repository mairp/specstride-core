/**
 * T108 — THE HOST HOLD RECORD (feature 154, US4 — F154-FR-041, F154-FR-044).
 *
 * One quota hold of one harness account: `<user-state>/holds/<account>.json`,
 * in the shape of `packages/contracts/schemas/154/host-hold.schema.json`
 * (`specstride.host-hold/1`). A run that classifies a `quota_window` with a
 * non-null `resetsAt` writes the hold through `enterPause` (F127-FR-010
 * amended, T109); before starting a pass, every run of the same account on the
 * host reads it and waits until the reset through the same pause, the class
 * `host_slot`, which spends nothing. The record is written by its holder's
 * runtime root only, ATOMICALLY — one temporary file in the same directory,
 * fsynced, renamed into place — and it is OVERWRITTEN, never merged: the
 * newest reset wins. Nothing here deletes an expired hold: the consumers (the
 * pause logic of `packages/policy/src/quota/pause.ts`) decide on expiry
 * handling. No model is asked whether to wait (F154-FR-047): this module is
 * engine/runtime-side only.
 *
 * The owner record is the one of the workspace lock (§B.9), built by
 * `../lock/owner-record.ts` and extended with the three fields the hold
 * schema adds (`livenessEndpoint`, `acquiredAt`, `runId`), so a hold whose
 * writer died is recognisable from the record alone — and still NOT reclaimed
 * early: it blocks until its `resetAt` and only ceases to block after it
 * (F154-FR-041).
 */
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync, fsyncSync } from "node:fs";
import { join } from "node:path";
import { buildOwnerRecord, type BuiltOwnerRecord } from "../lock/owner-record.ts";

/** The schema id of the hold record (`host-hold.schema.json`). */
export const HOLD_SCHEMA_ID = "specstride.host-hold/1" as const;

/** The directory under the user state root that holds the hold records. */
export const HOLDS_DIRECTORY = "holds" as const;

/** The fields of the hold record, in the order the schema lists them. */
export const HOLD_RECORD_FIELDS = Object.freeze([
  "schema",
  "account",
  "harness",
  "resetAt",
  "writtenAt",
  "owner",
] as const);

/** The fields of the owner record the hold schema adds to §B.9's eight. */
const OWNER_EXTRA_FIELDS = ["livenessEndpoint", "acquiredAt", "runId"] as const;

export type HoldOwnerField = (typeof OWNER_EXTRA_FIELDS)[number];

/** The owner record of a hold: §B.9's eight fields plus the hold's three. */
export type HoldOwner = BuiltOwnerRecord & {
  readonly livenessEndpoint: string;
  readonly acquiredAt: string;
  readonly runId: string;
};

/** The hold record, in the shape of `host-hold.schema.json`. */
export type HoldRecord = {
  readonly schema: typeof HOLD_SCHEMA_ID;
  readonly account: string;
  readonly harness: string;
  /** When the provider's window resets; a run of the account waits until then. */
  readonly resetAt: string;
  readonly writtenAt: string;
  readonly owner: HoldOwner;
};

/** What the caller of `writeHold` knows that the platform cannot tell. */
export type HoldOwnerInput = {
  /** The process that holds the account; this process where none is named. */
  readonly pid?: number;
  /** The launch that wrote the hold. */
  readonly launchId?: string;
  /** The HASH of the run token; the token itself never reaches a record. */
  readonly runTokenHash?: string;
  /** The run whose classification wrote the hold. */
  readonly runId?: string;
  /** The harness of the account; `claude` where none is named. */
  readonly harness?: string;
};

/** A record the reader refuses. */
export class HoldRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HoldRecordError";
  }
}

/** The physical path of one account's hold: `<user-state>/holds/<account>.json`. */
export function holdPath(userStateRoot: string, account: string): string {
  const safe = account.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  return join(userStateRoot, HOLDS_DIRECTORY, `${safe}.json`);
}

/** The holds directory of a user state root, made when missing. */
export function holdsDirectory(userStateRoot: string): string {
  const dir = join(userStateRoot, HOLDS_DIRECTORY);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Build the hold record of one account: the schema's six fields, the owner
 * built from the platform readers of §B.9 (never from guesses), `writtenAt`
 * the instant the caller names. The account and the reset time are required
 * and are carried verbatim.
 */
export function buildHoldRecord(
  account: string,
  resetAt: string,
  owner: HoldOwnerInput,
  writtenAt: string,
): HoldRecord {
  if (account === "") throw new HoldRecordError("a hold record needs an account");
  if (resetAt === "") throw new HoldRecordError("a hold record needs a reset time");
  const built = buildOwnerRecord({
    launchId: owner.launchId ?? "",
    runTokenHash: owner.runTokenHash ?? "",
    ...(owner.pid === undefined ? {} : { pid: owner.pid }),
  });
  const full: HoldOwner = Object.freeze({
    ...built,
    livenessEndpoint: "",
    acquiredAt: writtenAt,
    runId: owner.runId ?? "",
  });
  const record: HoldRecord = Object.freeze({
    schema: HOLD_SCHEMA_ID,
    account,
    harness: owner.harness ?? "claude",
    resetAt,
    writtenAt,
    owner: full,
  });
  for (const field of HOLD_RECORD_FIELDS) {
    if (record[field] === undefined) {
      throw new HoldRecordError(`the hold record of ${account} lacks the field ${field}`);
    }
  }
  for (const field of OWNER_EXTRA_FIELDS) {
    if ((record.owner as unknown as Readonly<Record<string, unknown>>)[field] === undefined) {
      throw new HoldRecordError(`the owner record of the hold ${account} lacks ${field}`);
    }
  }
  return record;
}

/** The record as it is written: one line of canonical JSON (keyed, indented). */
export function serializeHoldRecord(record: HoldRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

/**
 * F154-FR-044 — write the hold of one account, atomically: a temporary file
 * in the SAME directory, fsynced, renamed over any record already there. The
 * newest reset wins; the write never merges with an existing record. Returns
 * the path the record stands at.
 */
export function writeHold(
  userStateRoot: string,
  account: string,
  resetAt: string,
  owner: HoldOwnerInput,
  writtenAt: string = new Date().toISOString(),
): string {
  const record = buildHoldRecord(account, resetAt, owner, writtenAt);
  const dir = holdsDirectory(userStateRoot);
  const final = holdPath(userStateRoot, account);
  const temp = join(dir, `.${account}.${process.pid}.${Math.floor(Math.random() * 1e9)}.tmp`);
  let fd: number | null = null;
  try {
    writeFileSync(temp, serializeHoldRecord(record), { flag: "wx" });
    try {
      fd = openSync(temp, "r+");
      fsyncSync(fd);
    } finally {
      if (fd !== null) closeSync(fd);
    }
    renameSync(temp, final);
  } catch (error) {
    try {
      rmSync(temp, { force: true });
    } catch {
      /* the temporary file is best effort; the failure stands */
    }
    throw error;
  }
  return final;
}

/**
 * Read the hold of one account, or `null` where none stands or the file does
 * not parse into a `specstride.host-hold/1` for that account: an unreadable
 * hold is a fact, not a failure, and a run never waits on a record it cannot
 * read as its own.
 */
export function readHold(userStateRoot: string, account: string): HoldRecord | null {
  const path = holdPath(userStateRoot, account);
  if (!existsSync(path)) return null;
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Readonly<Record<string, unknown>>;
  if (record["schema"] !== HOLD_SCHEMA_ID) return null;
  if (record["account"] !== account) return null;
  if (typeof record["resetAt"] !== "string" || record["resetAt"] === "") return null;
  if (typeof record["writtenAt"] !== "string" || record["writtenAt"] === "") return null;
  const owner = record["owner"];
  if (typeof owner !== "object" || owner === null) return null;
  if (typeof (owner as Readonly<Record<string, unknown>>)["pid"] !== "number") return null;
  return Object.freeze({
    schema: HOLD_SCHEMA_ID,
    account,
    harness: typeof record["harness"] === "string" ? record["harness"] : "claude",
    resetAt: record["resetAt"],
    writtenAt: record["writtenAt"],
    owner: Object.freeze(owner as HoldOwner),
  });
}
