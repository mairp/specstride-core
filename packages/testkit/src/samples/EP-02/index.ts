/**
 * T098 — the sample implementation of EP-02, the harness port, outside the
 * core, registered from the test tree (annex A, §A.4, F100-FR-018; annex X,
 * §X.10, F100-FR-222).
 *
 * A descriptor-only fake harness: a fake CLI whose `detect` reports a version
 * and whose `complete` returns one reply with the facts of an initial record.
 * It starts no process and makes no paid call. No file of a core package
 * names it (F100-FR-012).
 */
import { FAILURE_WHEN_UNKNOWN, contextWindowInForce } from "@specstride/contracts/ep/harness";
import type {
  BetweenPassesOutcome,
  Capabilities,
  CompleteInput,
  CompleteResult,
  ClassifyInput,
  DetectResult,
  PassHandle,
  PreflightResult,
  StartPassInput,
  StopKind,
  TypedFailure,
} from "@specstride/contracts/ep/harness";
import type { Implementation } from "../../conformance/frame.ts";

const capabilities: Capabilities = Object.freeze({
  containmentCeiling: { value: "C1", provenance: "declared" },
  continuation: { value: false, provenance: "declared" },
  modelTierLadder: { value: Object.freeze(["small", "large"]), provenance: "declared" },
  usageSource: { value: "stream", provenance: "declared" },
  nativeMemorySwitch: { value: null, provenance: null },
  toolLessMode: { value: true, provenance: "declared" },
  readOnlyCriticMode: { value: false, provenance: "declared" },
  contextWindow: { value: contextWindowInForce(200000, 100000), provenance: "probed" },
  concurrentSessions: { value: 1, provenance: "declared" },
  processSpendingLimit: { value: false, provenance: "declared" },
  transports: { value: Object.freeze(["subprocess"] as const), provenance: "declared" },
});

async function* oneLine(): AsyncGenerator<string> {
  yield '{"type":"system","session_id":"sample-session"}';
}

export const operations = Object.freeze({
  detect(): Promise<DetectResult> {
    return Promise.resolve(
      Object.freeze({ present: true, version: "0.0.0-sample", configurationHomeExists: false }),
    );
  },
  capabilities(): Promise<Capabilities> {
    return Promise.resolve(capabilities);
  },
  preflight(role: string): Promise<PreflightResult> {
    return Promise.resolve(
      Object.freeze({ credentialPresent: true, refused: false, reason: role }),
    );
  },
  startPass(input: StartPassInput): Promise<PassHandle> {
    return Promise.resolve(
      Object.freeze({
        pid: 0,
        startTime: "2026-10-01T00:00:00.000Z",
        stream: oneLine(),
        sessionId: input.session.kind === "continue" ? input.session.sessionId : "sample-session",
      }),
    );
  },
  complete(input: CompleteInput): Promise<CompleteResult> {
    return Promise.resolve(
      Object.freeze({
        reply: "VERDICT: REJECTED",
        usage: Object.freeze({ inputTokens: 1, outputTokens: 1 }),
        initialRecord: Object.freeze({
          tools: Object.freeze([]),
          sessionId: input.sessionId,
          sandboxMode: "none",
          networkState: "off",
        }),
      }),
    );
  },
  stop(_handle: PassHandle, _kind: StopKind): Promise<boolean> {
    return Promise.resolve(true);
  },
  betweenPasses(): Promise<BetweenPassesOutcome> {
    return Promise.resolve(Object.freeze({ outcome: "continue" as const }));
  },
  classify(seen: ClassifyInput): TypedFailure {
    if (seen.status?.code === 429) {
      return Object.freeze({ failure: "rate_limited" as const, detail: "status 429" });
    }
    return Object.freeze({ failure: FAILURE_WHEN_UNKNOWN, detail: "the sample knows no other" });
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-02",
  pointId: "specstride.harness/1",
  id: "sample-harness-fake-cli",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
