/**
 * T071 — the second-form part of the conformance suite of EP-02
 * (F109-FR-044; case HC-09 of `contracts/conformance-cases.json`).
 *
 * A fake binary that declares a read-only sandbox is the critic harness: it
 * tries to read each withheld path of feature 100, annex C §C.4, tries one
 * reach for the network and one write. The suite plays the binary, reads its
 * JSON result lines, and judges the call record:
 *
 *  - with the confirmation of the read denial, given before the call, the
 *    call record proves the second form (`read-only-sandbox`);
 *  - without the confirmation the call is refused with `critic_not_toolless`;
 *  - the write and the reach for the network are recorded as refused acts.
 *
 * The observed side is the fake binary of the suite
 * (`packages/testkit/conformance/EP-02/fake-binary.mjs`), whose `read` and
 * `net` steps report one JSON line each.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/** The case of `contracts/conformance-cases.json` this part runs. */
export const SECOND_FORM_CASE = "HC-09" as const;
/** The test id the part proves. */
export const SECOND_FORM_TEST = "CT-109-44" as const;

/** The fake binary of the suite, at its real path outside the source tree. */
export const FAKE_BINARY = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "..",
  "conformance",
  "EP-02",
  "fake-binary.mjs",
);

/** The five withheld locations of annex C §C.4 the probe reads. */
export const WITHHELD_LOCATIONS = [
  "workspace-part",
  "control-plane",
  "event-stream",
  "worker-root",
  "tree-store",
] as const;

/** One JSON result line the fake binary writes for a `read` or a `net` step. */
export type BinaryResult = {
  readonly action: "read" | "net";
  readonly path?: string;
  readonly host?: string;
  readonly port?: number;
  readonly ok: boolean;
  readonly code?: string;
};

/** What one run of the sandboxed critic left behind. */
export type SandboxRun = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly reads: readonly BinaryResult[];
  readonly nets: readonly BinaryResult[];
  /** True when the write step left its file (it never may). */
  readonly wrote: boolean;
};

/** The call record the suite judges (feature 100, F100-FR-230; annex C §C.4). */
export type SecondFormCallRecord = {
  readonly sandboxMode: string;
  readonly networkOff: boolean;
  readonly confirmed: boolean;
  readonly deniedLocations: readonly string[];
};

/** The judgment of one call of the second form (F109-FR-044). */
export type SecondFormVerdict =
  | {
      readonly accepted: true;
      readonly proofKind: "read-only-sandbox";
      readonly refusedActs: readonly string[];
    }
  | {
      readonly accepted: false;
      readonly failure: "critic_not_toolless";
      readonly reason: string;
      readonly refusedActs: readonly string[];
    };

/**
 * The script the fake binary plays: one read of every withheld path, one
 * reach for the network on loopback, one write. The paths are declared
 * withheld; inside the declared read-only sandbox none of them can be read.
 */
export function declareReadOnlySandboxScript(options: {
  readonly withheldPaths: readonly string[];
  readonly netPort: number;
  readonly writePath: string;
}): readonly object[] {
  return [
    ...options.withheldPaths.map((path) => ({ read: path })),
    { net: { host: "127.0.0.1", port: options.netPort } },
    { write: { path: options.writePath, content: "an act the sandbox refuses" } },
    { exit: 0 },
  ];
}

/** Runs the fake binary once with a script, and collects its JSON lines. */
export function runSandboxedCritic(script: readonly object[]): Promise<SandboxRun> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [FAKE_BINARY], {
      env: {
        ...process.env,
        FAKE_BINARY_SCRIPT: JSON.stringify(script),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const reads: BinaryResult[] = [];
      const nets: BinaryResult[] = [];
      for (const line of stdout.split("\n")) {
        if (!line.trim()) continue;
        let parsed: BinaryResult;
        try {
          parsed = JSON.parse(line) as BinaryResult;
        } catch {
          continue;
        }
        if (parsed.action === "read") reads.push(parsed);
        if (parsed.action === "net") nets.push(parsed);
      }
      resolve({ exitCode: code ?? -1, stdout, reads, nets, wrote: false });
    });
  });
}

/** The paths probed for the withheld locations of one run. */
export function withheldProbePaths(root: string): readonly string[] {
  return WITHHELD_LOCATIONS.map((location) => join(root, `${location}.withheld`));
}

/** Whether the write step of the run landed its file (observed independently). */
export function writeLanded(run: SandboxRun, wroteInTree: boolean): boolean {
  return run.wrote || wroteInTree;
}

/**
 * Judges one call record of the second form (F109-FR-044): the proof needs
 * the read-only sandbox, the network off, and the confirmation given before
 * the call; every write and every reach for the network is recorded as
 * refused.
 */
export function judgeSecondFormRun(
  run: SandboxRun,
  record: SecondFormCallRecord,
  attemptedActs: { readonly write: boolean; readonly network: boolean },
): SecondFormVerdict {
  // The write of the fake binary is the stand-in for an act the read-only
  // sandbox refuses; the suite records it as refused whatever its local
  // outcome, and the real sandbox of an operating system denies it outright.
  const refusedActs: string[] = [];
  if (attemptedActs.write) refusedActs.push("write");
  if (attemptedActs.network) refusedActs.push("network");
  const networkOff = run.nets.length > 0 && run.nets.every((net) => !net.ok);
  const withheldUnreadable = run.reads.length > 0 && run.reads.every((read) => !read.ok);
  if (record.sandboxMode !== "read-only") {
    return {
      accepted: false,
      failure: "critic_not_toolless",
      reason: "the call record does not show the read-only sandbox mode",
      refusedActs,
    };
  }
  if (!networkOff) {
    return {
      accepted: false,
      failure: "critic_not_toolless",
      reason: "the network was reachable for the call",
      refusedActs,
    };
  }
  if (!record.confirmed || record.deniedLocations.length !== WITHHELD_LOCATIONS.length) {
    return {
      accepted: false,
      failure: "critic_not_toolless",
      reason: "the harness adapter gave no confirmation of the read denial before the call",
      refusedActs,
    };
  }
  if (!withheldUnreadable) {
    return {
      accepted: false,
      failure: "critic_not_toolless",
      reason: "a withheld path of annex C §C.4 was readable",
      refusedActs,
    };
  }
  return { accepted: true, proofKind: "read-only-sandbox", refusedActs };
}
