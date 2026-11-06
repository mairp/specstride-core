/**
 * T035 — the PARENT of the two cases of the conformance suite of EP-17
 * (annex F, §F.6 "Proving test": *start; end the parent; confirm that the child
 * lives and that the lease is valid; then the same with the parent killed by a
 * signal*).
 *
 * The suite cannot be the parent itself: the suite is the test process, which is
 * alive by definition, so "end the parent" could only be faked. This file is
 * the parent that can really end. It calls `start` of the sample strategy,
 * writes a record naming the process it started, and then does one of two
 * things the suite chooses:
 *
 *   - `--then exit`: returns at once, so the parent ends of its own accord;
 *   - `--then wait`: stays alive, so the suite can kill it without warning.
 *
 * It installs no handler, so nothing of this file runs when it is killed. That
 * is what makes the second case a real one.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { useContext } from "./sample-strategy.ts";

/** This file, so that the suite can start it. */
export const SAMPLE_PARENT_ENTRY = fileURLToPath(import.meta.url);

/** The kind of the record the parent writes once it has started the root. */
export const STARTED_KIND = "specstride.test.sample-detach-parent/1" as const;

/** What the parent reports. */
export type StartedRecord = {
  readonly kind: typeof STARTED_KIND;
  /** The process id of the parent itself, which the suite ends. */
  readonly parentPid: number;
  /** The process id of the root the strategy started, which must survive. */
  readonly childPid: number;
  readonly sessionLeader: boolean;
  readonly startTime: string;
  readonly launchNonce: string;
};

function flag(argv: readonly string[], name: string): string {
  const at = argv.indexOf(`--${name}`);
  const value = at === -1 ? undefined : argv[at + 1];
  if (value === undefined) throw new Error(`the sample parent needs --${name}`);
  return value;
}

async function runAsTheParent(argv: readonly string[]): Promise<void> {
  const strategy = useContext({
    leaseFile: flag(argv, "lease"),
    logFile: flag(argv, "log"),
    runId: flag(argv, "run"),
    launchId: flag(argv, "launch"),
  });
  const nonce = flag(argv, "nonce");
  const started = await strategy.start({
    runtimeEntry: [process.execPath, "--sample-runtime-entry"],
    environmentAllowList: ["PATH", "LC_ALL", "HOME"],
    runtimeLogLogicalName: "launch:<launchId>:runtime-log",
    launchNonce: nonce,
  });
  const record: StartedRecord = {
    kind: STARTED_KIND,
    parentPid: process.pid,
    childPid: started.pid,
    sessionLeader: started.sessionLeader,
    startTime: started.startTime,
    launchNonce: nonce,
  };
  writeFileSync(flag(argv, "started"), JSON.stringify(record, null, 2) + "\n", { mode: 0o600 });
  if (flag(argv, "then") === "wait") {
    // Alive until the suite kills it without warning. No handler is installed.
    setInterval(() => {}, 60_000);
    return;
  }
  // The parent ends of its own accord, and the child must outlive it.
  process.exit(0);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === SAMPLE_PARENT_ENTRY) {
  void runAsTheParent(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(
      `sample-parent: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
}
