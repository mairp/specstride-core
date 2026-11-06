/**
 * T152 — the sample implementation of EP-14, the doctor check registry,
 * outside the core, registered from the test tree (annex A, §A.4,
 * F100-FR-018; annex X, §X.10, F100-FR-222).
 *
 * A sample check registered from the test tree, which §G.7 "Proving test"
 * names: it appears in the `--json` output, and with `lb` set it refuses a
 * launch, with no core file changed.
 */
import { launchChecks, PROBE_TIMED_OUT_MESSAGE } from "@specstride/contracts/ep/doctor";
import type {
  DoctorCheck,
  DoctorFinding,
  DoctorRunInput,
  Severity,
} from "@specstride/contracts/ep/doctor";
import type { Implementation } from "../../conformance/frame.ts";

const registered: DoctorCheck[] = [];

/** The sample check; its id is of the stable dotted form of §G.7. */
export const SAMPLE_CHECK: DoctorCheck = Object.freeze({
  id: "sample.testkit.present",
  severityRule(observed: unknown): Severity {
    return observed === true ? "ok" : "fail";
  },
  lb: true,
  order: 1,
  probe(injected: Readonly<Record<string, unknown>>): Promise<unknown> {
    if (injected["timeout"] === true) return Promise.reject(new Error(PROBE_TIMED_OUT_MESSAGE));
    return Promise.resolve(injected["present"] !== false);
  },
  messageTemplate: "the sample check of the test kit reports {state}",
  fixHint: "nothing to fix: the sample check is part of the test tree",
});

export const operations = Object.freeze({
  register(check: DoctorCheck): void {
    registered.push(check);
  },
  /**
   * Remove one registered check by id. Registration is process memory:
   * registering or removing a check changes no core file (F112-FR-002,
   * last sentence) — CT-112-207 exercises exactly this.
   */
  remove(id: string): boolean {
    const before = registered.length;
    for (let i = registered.length - 1; i >= 0; i -= 1) {
      if (registered[i]?.id === id) registered.splice(i, 1);
    }
    return registered.length < before;
  },
  registered(): readonly DoctorCheck[] {
    return Object.freeze([...registered]);
  },
  async run(input: DoctorRunInput): Promise<readonly DoctorFinding[]> {
    const checks = registered.length > 0 ? registered : [SAMPLE_CHECK];
    const out: DoctorFinding[] = [];
    for (const check of [...checks].sort((a, b) => a.order - b.order)) {
      let observed: unknown;
      let severity: Severity;
      let message: string;
      try {
        observed = await check.probe(input.context);
        severity = check.severityRule(observed);
        message = check.messageTemplate.replace("{state}", String(observed));
      } catch (error) {
        severity = "warn";
        message = error instanceof Error ? error.message : PROBE_TIMED_OUT_MESSAGE;
      }
      out.push(
        Object.freeze({
          id: check.id,
          severity,
          lb: check.lb,
          message: message.slice(0, 200),
          fix: check.fixHint,
          evidence: "(redacted)",
        }),
      );
    }
    return Object.freeze(out);
  },
});

/** The `lb` subset, which is exactly the launch checks (F100-FR-189). */
export function sampleLaunchChecks(): readonly DoctorCheck[] {
  return launchChecks(registered.length > 0 ? registered : [SAMPLE_CHECK]);
}

export const implementation: Implementation = Object.freeze({
  ep: "EP-14",
  pointId: "specstride.doctor/1",
  id: "sample-doctor-check",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
