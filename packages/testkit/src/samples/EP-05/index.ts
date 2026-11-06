/**
 * T105 — the sample implementation of EP-05, the check runner, outside the
 * core, registered from the test tree (annex A, §A.4, F100-FR-018; annex X,
 * §X.10, F100-FR-222).
 *
 * A runner of the kind `command` that starts no process: it serves an entry
 * of its kind from a scripted table of outcomes (pass, fail, slow, never
 * ending, very large output), as §C.8 "Proving test" asks.
 */
import { CONDITION_WHEN_UNKNOWN } from "@specstride/contracts/ep/check-runner";
import type {
  CheckHandle,
  CheckResult,
  ManifestEntry,
  PinnedIdentity,
  PollResult,
  StartInput,
} from "@specstride/contracts/ep/check-runner";
import type { Implementation } from "../../conformance/frame.ts";

/** The scripted outcomes the sample serves, by the id of the entry. */
export const SCRIPT: Readonly<Record<string, { exitCode: number; condition?: string }>> =
  Object.freeze({
    pass: { exitCode: 0 },
    fail: { exitCode: 1 },
    slow: { exitCode: 0, condition: "flaky" },
    "never-ending": { exitCode: 124, condition: "interrupted" },
    "very-large-output": { exitCode: 0, condition: "unchecked" },
  });

const started = new Map<string, ManifestEntry>();
let next = 0;

export const operations = Object.freeze({
  pin(entry: ManifestEntry): Promise<PinnedIdentity> {
    return Promise.resolve(
      Object.freeze({
        kind: "command" as const,
        executable: `/sample/bin/${entry.id}`,
        size: 1024,
        hash: "4".repeat(64),
        argv: entry.argv,
      }),
    );
  },
  start(input: StartInput): Promise<CheckHandle> {
    const id = `handle-${++next}`;
    started.set(id, {
      id: input.identity.executable?.split("/").pop() ?? "pass",
      kind: "command",
      argv: input.identity.argv ?? [],
      phase: 1,
      timeLimitMs: input.timeLimitMs,
    });
    return Promise.resolve(Object.freeze({ id }));
  },
  poll(_handle: CheckHandle): Promise<PollResult> {
    return Promise.resolve(Object.freeze({ state: "ended" as const }));
  },
  result(handle: CheckHandle): Promise<CheckResult> {
    const entry = started.get(handle.id);
    const scripted = SCRIPT[entry?.id ?? "pass"] ?? SCRIPT["pass"];
    const condition = scripted?.condition;
    return Promise.resolve(
      Object.freeze({
        exitCode: scripted?.exitCode ?? 0,
        durationMs: 1,
        output: Object.freeze({
          logicalName: "attempt:1:1:1:check-output",
          hash: "5".repeat(64),
          size: 12,
        }),
        tainted: condition === "tainted",
        cached: condition === "cached",
        flaky: condition === "flaky",
        interrupted: condition === "interrupted",
        unchecked: condition === "unchecked" || condition === CONDITION_WHEN_UNKNOWN,
        ...(condition === undefined ? {} : { reason: "slow" as const }),
      }),
    );
  },
  cancel(handle: CheckHandle): Promise<void> {
    started.delete(handle.id);
    return Promise.resolve();
  },
  environment(entry: ManifestEntry): Readonly<Record<string, string>> {
    return Object.freeze({ PATH: "/usr/bin:/bin", LC_ALL: "C", ...(entry.env ?? {}) });
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-05",
  pointId: "specstride.check-runner/1",
  id: "sample-check-runner-scripted",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
