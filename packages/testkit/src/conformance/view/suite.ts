/**
 * T065 — the conformance suite of EP-09, the UI read model `RunView`
 * (F129-FR-036). It is the BEHAVIOUR half of the point: feature 100's
 * `src/conformance/EP-09/contract.test.ts` holds the contract-level cases;
 * this suite holds the five behaviour checks the content owner adds, and runs
 * them against ANY implementation of the point that is handed in — the shipped
 * `@specstride/view` and the second read model registered from the test tree
 * (`src/samples/129/second-read-model.ts`) at the least.
 *
 * The checks: the golden views (byte for byte over two projections), the
 * prefix property (fold over a prefix equals the projection of that prefix,
 * for every prefix), the table of liveness, the sample renderer given the JSON
 * and no file handle, and the canary (a planted marker of the run never
 * reaches the view sink unredacted). CT-129-36 and CT-129-40 are the tests
 * that run it; the fixture logs stay in the test tree and are handed in.
 */
import { project, reduce, renderView } from "@specstride/view";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";
import { renderViewJson } from "../../samples/129/sample-renderer.ts";
import { operations as secondOperations } from "../../samples/129/second-read-model.ts";

/** The inputs of one projection, as the suite hands them to an implementation. */
export type SuiteInputs = {
  readonly events: readonly EventEnvelope[];
  readonly runRecord: Readonly<Record<string, unknown>> | null;
  readonly leaseProbe: string | null;
  readonly now: string;
};

/** One implementation of EP-09 the suite can run against. */
export type ViewImplementation = {
  readonly id: string;
  project(inputs: SuiteInputs): unknown;
  reduce(view: unknown, event: EventEnvelope): unknown;
  serialize(view: unknown): string;
};

/** The shipped implementation: the pure package this feature delivers. */
export const shippedViewImplementation: ViewImplementation = Object.freeze({
  id: "@specstride/view (shipped)",
  project(inputs: SuiteInputs): unknown {
    return project({
      events: { events: inputs.events },
      stateFiles: {
        runRecord: inputs.runRecord,
        terminalRecord: null,
        pauseRecord: null,
      },
      observations: {
        lease: inputs.leaseProbe === null ? null : { probe: inputs.leaseProbe },
        newestLaunchRecord: null,
        supervisionRecord: null,
        processTableSearch: null,
        handshakeLimitSec: null,
      },
      now: inputs.now,
    });
  },
  reduce(view: unknown, event: EventEnvelope): unknown {
    return reduce(view as Parameters<typeof reduce>[0], event);
  },
  serialize(view: unknown): string {
    return renderView(view as Parameters<typeof reduce>[0]);
  },
});

/** The second implementation, registered from the test tree (F129-FR-036). */
export const secondReadModelImplementation: ViewImplementation = Object.freeze({
  id: "second-read-model-129 (test tree)",
  project(inputs: SuiteInputs): unknown {
    return secondOperations.project({
      events: { events: inputs.events },
      stateFiles: { runRecord: inputs.runRecord },
      observations: {
        lease: inputs.leaseProbe === null ? null : { probe: inputs.leaseProbe },
      },
      now: inputs.now,
    });
  },
  reduce(view: unknown, event: EventEnvelope): unknown {
    return secondOperations.reduce(view as never, event);
  },
  serialize(view: unknown): string {
    return JSON.stringify(view);
  },
});

/** The result of one check, with the counts the report states. */
export type CheckResult = {
  readonly check: string;
  readonly ok: boolean;
  readonly passed: number;
  readonly total: number;
  readonly detail: readonly string[];
};

/** The result of the whole suite for one implementation. */
export type SuiteResult = {
  readonly implementation: string;
  readonly ok: boolean;
  readonly checks: readonly CheckResult[];
};

const count = (
  check: string,
  cases: readonly { readonly ok: boolean; readonly detail: string }[],
): CheckResult =>
  Object.freeze({
    check,
    ok: cases.every((c) => c.ok),
    passed: cases.filter((c) => c.ok).length,
    total: cases.length,
    detail: Object.freeze(cases.filter((c) => !c.ok).map((c) => c.detail)),
  });

/**
 * The suite. `logs` are the fixture projections the caller hands in (the
 * committed logs of the test tree); `livenessStates` and `livenessProbes` are
 * the axes of the liveness table; `marker` is the canary string.
 */
export function runViewConformance(
  impl: ViewImplementation,
  logs: readonly { readonly name: string; readonly inputs: SuiteInputs }[],
  livenessStates: readonly string[],
  livenessProbes: readonly string[],
  marker: string,
): SuiteResult {
  const checks: CheckResult[] = [];

  // 1. The golden views: two independent projections of every fixture log are
  //    equal BYTE FOR BYTE (CT-129-40).
  const golden = logs.map((log) => {
    const first = impl.serialize(impl.project(log.inputs));
    const second = impl.serialize(impl.project(log.inputs));
    return { ok: first === second && first.length > 0, detail: `${log.name}: golden bytes` };
  });
  checks.push(count("golden views: two projections, byte for byte", golden));

  // 2. The prefix property: folding from the base view over a prefix equals
  //    the projection of that prefix, for EVERY prefix (CT-129-40).
  const prefixCases: { ok: boolean; detail: string }[] = [];
  for (const log of logs) {
    const base = impl.project({ ...log.inputs, events: [] });
    const events = log.inputs.events;
    for (let end = 0; end <= events.length; end++) {
      const head = events.slice(0, end);
      const folded = head.reduce((view, event) => impl.reduce(view, event), base);
      const direct = impl.project({ ...log.inputs, events: head });
      prefixCases.push({
        ok: impl.serialize(folded) === impl.serialize(direct),
        detail: `${log.name}: prefix ${end}/${events.length}`,
      });
    }
  }
  checks.push(count("prefix property: every prefix, fold equals projection", prefixCases));

  // 3. The table of liveness: state x probe -> liveness and `dead` (CT-129-36).
  const liveness = livenessStates.flatMap((state) =>
    livenessProbes.map((probe) => ({ state, probe })),
  );
  const livenessCases = liveness.map(({ state, probe }) => {
    const view = impl.project({
      events: [],
      runRecord: { state },
      leaseProbe: probe,
      now: "2026-10-01T00:00:10.000Z",
    }) as Record<string, unknown>;
    const conditions = view["conditions"] as Record<string, unknown> | undefined;
    const dead = view["dead"] ?? conditions?.["dead"];
    const seen = `${String(view["liveness"])}/${String(dead)}`;
    const resting = ["finished", "failed", "stopped", "blocked-on-human"].includes(state);
    const expected = resting
      ? "not-applicable/false"
      : probe === "held-live"
        ? "alive/false"
        : probe === "free" || probe === "stale-owner-dead" || probe === "owner-dead-group-alive"
          ? "dead/true"
          : "unknown/false";
    return {
      ok: seen === expected,
      detail: `liveness[${state}, ${probe}] = ${seen}, expected ${expected}`,
    };
  });
  checks.push(count("table of liveness", livenessCases));

  // 4. The sample renderer: given the JSON of the view and NO file handle, it
  //    renders, and a failing render prints ONE line that names `status --json`
  //    (CT-129-36; F129-FR-032).
  const renderer = logs.slice(0, 1).map((log) => {
    const json = impl.serialize(impl.project(log.inputs));
    const outcome = renderViewJson(json);
    const failing = renderViewJson("{not json");
    const lineOk =
      !failing.ok && failing.lines.length === 1 && failing.lines[0].includes("status --json");
    return {
      ok: outcome.ok && (outcome.ok ? outcome.lines.length > 0 : false) && lineOk,
      detail: `${log.name}: sample renderer over the JSON of the view`,
    };
  });
  checks.push(count("sample renderer takes the JSON and no file handle", renderer));

  // 5. The canary: a marker planted in the free text of an event never reaches
  //    the serialized view (the sink of the read model is the redacted text).
  const canary = logs.slice(0, 1).map((log) => {
    const planted: EventEnvelope = {
      ...(log.inputs.events[0] ??
        ({
          schema: "specstride.event",
          v: 1,
          seq: 1,
          ts: log.inputs.now,
          type: "run.started",
          runId: "run-canary",
          launchId: "launch-canary",
          data: {},
        } as EventEnvelope)),
      data: { note: `see ${marker} for the plaintext` },
    };
    const view = impl.project({ ...log.inputs, events: [...log.inputs.events, planted] });
    const text = impl.serialize(view);
    return {
      ok: !text.includes(marker),
      detail: `${log.name}: canary marker absent from the view`,
    };
  });
  checks.push(count("canary: the planted marker never reaches the view", canary));

  return Object.freeze({
    implementation: impl.id,
    ok: checks.every((c) => c.ok),
    checks: Object.freeze(checks),
  });
}
