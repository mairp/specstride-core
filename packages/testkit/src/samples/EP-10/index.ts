/**
 * T114 — the sample implementation of EP-10, the secret resolver, outside the
 * core, registered from the test tree (annex A, §A.4, F100-FR-018; annex X,
 * §X.10, F100-FR-222).
 *
 * The sample resolver for the scheme `test:`, which §C.11 "Proving test"
 * names. `exists` never returns the value, and the resolver makes no network
 * call.
 */
import { schemeOf } from "@specstride/contracts/ep/secret-resolver";
import type {
  Existence,
  ResolvedSecret,
  SecretReference,
} from "@specstride/contracts/ep/secret-resolver";
import type { Implementation } from "../../conformance/frame.ts";

/** The one scheme the sample handles. */
export const SCHEME = "test:" as const;

/** The values the sample knows, by the target of the reference. */
export const VALUES: Readonly<Record<string, string>> = Object.freeze({
  present: "sample-secret-value",
});

/** The host each reference is bound to. */
export const BOUND_HOST = "sample.invalid" as const;

export const operations = Object.freeze({
  handles(scheme: string): boolean {
    return scheme === SCHEME;
  },
  exists(reference: SecretReference): Promise<Existence> {
    if (schemeOf(reference) !== SCHEME) return Promise.resolve("no" as Existence);
    const target = reference.slice(SCHEME.length);
    if (target === "unprobed") return Promise.resolve("unprobed" as Existence);
    return Promise.resolve((target in VALUES ? "yes" : "no") as Existence);
  },
  resolve(reference: SecretReference): Promise<ResolvedSecret> {
    const target = reference.slice(SCHEME.length);
    const value = VALUES[target];
    if (value === undefined) {
      return Promise.reject(new Error(`missing: no secret at \`${reference}\``));
    }
    return Promise.resolve(Object.freeze({ value, registeredWithTheRedactor: true as const }));
  },
  boundHost(reference: SecretReference): string | null {
    return schemeOf(reference) === SCHEME ? BOUND_HOST : null;
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-10",
  pointId: "specstride.secret-resolver/1",
  id: "sample-secret-resolver-test-scheme",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
