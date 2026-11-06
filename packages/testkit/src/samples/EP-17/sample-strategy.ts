/**
 * T035 — the SAMPLE detach strategy of EP-17, outside the core, registered from
 * the test tree (F122-FR-002; annex F §F.6 "Proving test"; annex A §A.4,
 * F100-FR-018).
 *
 * F122-FR-002 ends: *a sample strategy outside the core MUST pass the
 * conformance suite with no core file changed.* So this strategy detaches FOR
 * REAL and shares nothing with `spawn-detached`: it does not import
 * `@specstride/runtime`, it does not use the process primitive of the kernel,
 * and it calls `spawn` of the platform itself. That is the point — if the
 * conformance suite only passed for an implementation that borrowed the core's
 * machinery, it would be testing the machinery and not the contract.
 *
 * What it starts is `./sample-root.ts`, a stand-in for the runtime root that
 * writes the lease with the launch nonce and then stays alive. The suite's two
 * cases end the PARENT — once by letting it exit, once by killing it without
 * warning — and then read two things off the disk: that the started process is
 * still there, and that the lease is valid.
 *
 * `index.ts` beside this file holds a SECOND, non-starting sample (T143 of
 * feature 100), which the contract-level suite CT-100-265 drives. The two do
 * not collide: they carry different implementation ids, and a registry keyed by
 * id accepts both.
 */
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";
import {
  STRATEGY_WITHOUT_DETACHING,
  type AvailableResult,
  type DetachStrategy,
  type StartInput,
  type StartedProcess,
  type StrategyDescription,
} from "@specstride/contracts/ep/detach";
import type { Implementation } from "../../conformance/frame.ts";
import { SAMPLE_ROOT_ENTRY } from "./sample-root.ts";

/** The id of this sample strategy. It is not one of the two of Wave 1. */
export const SAMPLE_STRATEGY_ID = "sample-spawn-detached" as const;

/** The id it registers under. */
export const SAMPLE_IMPLEMENTATION_ID = "sample-detach-strategy-detaching" as const;

/** F122-FR-002 — a sample outside the core changes no core file. */
export const IMPORTS_THE_CORE = false as const;
export const IMPORTS_THE_KERNEL_PRIMITIVE = false as const;

/**
 * F122-FR-003 — what this sample survives. It calls `setsid` through
 * `detached: true`, so the end of its parent does not reach it; no Wave 1
 * strategy claims `reboot`, and a sample claims no more than the strategies it
 * stands in for.
 */
export const SAMPLE_SURVIVES = Object.freeze({
  endOfTheParent: true,
  endOfTheHostSession: true,
  reboot: false,
});

/** What the sample needs to know about the launch it is starting. */
export type SampleContext = {
  /** Where the stand-in writes the lease; the suite reads it from there. */
  readonly leaseFile: string;
  /** Where both outputs of the stand-in are appended. */
  readonly logFile: string;
  readonly runId: string;
  readonly launchId: string;
  /** Where the stand-in is started; a directory that exists. */
  readonly cwd?: string | undefined;
};

/** Every start this sample performed, with the pid it produced. */
export const sampleStarts: { input: StartInput; pid: number }[] = [];

/** §F.6 — the error `unavailable`, where the sample cannot start the root. */
export class SampleUnavailableError extends Error {
  readonly error = "unavailable" as const;
  readonly namesTheStrategy = STRATEGY_WITHOUT_DETACHING;
  constructor(detail: string) {
    super(
      `the sample detach strategy \`${SAMPLE_STRATEGY_ID}\` could not start the root: ${detail}. ` +
        `Run without detaching with \`${STRATEGY_WITHOUT_DETACHING}\``,
    );
    this.name = "SampleUnavailableError";
  }
}

/** Build the sample strategy over one launch. */
export function createSampleDetachStrategy(context: SampleContext): DetachStrategy {
  return Object.freeze({
    available(): AvailableResult {
      return Object.freeze({
        available: true,
        reason:
          `\`${SAMPLE_STRATEGY_ID}\` starts \`sample-root.ts\` detached with the platform's own ` +
          `\`spawn\`; it imports nothing of the core`,
      });
    },

    start(input: StartInput): Promise<StartedProcess> {
      if (input.runtimeEntry.length === 0) {
        throw new SampleUnavailableError("the runtime entry is an empty argument list");
      }
      mkdirSync(dirname(context.logFile), { recursive: true, mode: 0o700 });
      mkdirSync(dirname(context.leaseFile), { recursive: true, mode: 0o700 });
      // Standard input on the null device; both outputs APPENDED to one log.
      const stdin = openSync("/dev/null", "r");
      const log = openSync(context.logFile, "a", 0o600);
      try {
        const environment: Record<string, string> = {};
        for (const name of input.environmentAllowList) {
          const value = process.env[name];
          if (typeof value === "string") environment[name] = value;
        }
        environment.SAMPLE_LAUNCH_NONCE = input.launchNonce;
        const child = spawn(
          process.execPath,
          [
            SAMPLE_ROOT_ENTRY,
            "--lease",
            context.leaseFile,
            "--run",
            context.runId,
            "--launch",
            context.launchId,
            "--nonce",
            input.launchNonce,
          ],
          {
            cwd: context.cwd ?? dirname(SAMPLE_ROOT_ENTRY),
            env: environment,
            stdio: [stdin, log, log],
            // `setsid`: a session and a group of its own.
            detached: true,
            shell: false,
          },
        );
        const pid = child.pid;
        if (pid === undefined) {
          throw new SampleUnavailableError("the started process has no process id");
        }
        // Nothing of the parent holds it: no pipe, no parent that waits.
        child.unref();
        sampleStarts.push({ input, pid });
        return Promise.resolve(
          Object.freeze({ pid, startTime: new Date().toISOString(), sessionLeader: true }),
        );
      } finally {
        for (const fd of [stdin, log]) {
          try {
            closeSync(fd);
          } catch {
            /* the child holds its own copy */
          }
        }
      }
    },

    describe(): StrategyDescription {
      return Object.freeze({ id: SAMPLE_STRATEGY_ID, survives: SAMPLE_SURVIVES });
    },
  });
}

/**
 * The implementation record the conformance suite registers. The operations are
 * resolved against a context the suite sets before each case, because a
 * registry entry is made once and a case starts a different launch each time.
 */
let current: DetachStrategy | null = null;

/** Point the registered implementation at the launch a case is running. */
export function useContext(context: SampleContext): DetachStrategy {
  current = createSampleDetachStrategy(context);
  return current;
}

function strategy(): DetachStrategy {
  if (current === null) {
    throw new Error(
      `the sample detach strategy was used before a case gave it a launch; call ` +
        `\`useContext\` first`,
    );
  }
  return current;
}

export const operations = Object.freeze({
  available: (): AvailableResult => strategy().available(),
  start: (input: StartInput): Promise<StartedProcess> => strategy().start(input),
  describe: (): StrategyDescription => strategy().describe(),
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-17",
  pointId: "specstride.detach/1",
  id: SAMPLE_IMPLEMENTATION_ID,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
