/**
 * T058 — the assertions before normalization (F141-FR-021).
 *
 * "Before it normalizes, the comparator MUST assert what normalization would hide:
 * the form of every nonce and that no two critic calls share one; that time values
 * do not decrease where the reference's do not; that a hash of the path class is
 * right for its own input; that a hash of the implementation class is consistent
 * with what it covers. A failed assertion MUST give `different`."
 *
 * Four assertions, and the reason they are HERE and not in the normalizer is in
 * the first clause: once N-06 has turned every nonce into `<nonce-1>`, neither its
 * form nor its uniqueness can be seen; once N-04 has turned every time into
 * `<time>`, their order cannot. So the assertions run on the capture AS CAPTURED
 * and their outcome travels with the result of the surface.
 *
 * A failed assertion is not an exception: it is a `different` with the assertion
 * named (F141-FR-021). `assertBeforeNormalization` therefore RETURNS its findings
 * and throws nothing — a comparator that threw would stop the suite instead of
 * reporting one surface.
 */
import {
  implementationClassInconsistencies,
  noncesOf,
  boundNoncesOf,
  pathClassMismatches,
  timeValuesOf,
} from "../normalize/index.ts";
import { collect } from "../normalize/walk.ts";

/** The four assertions of F141-FR-021, by name. */
export const ASSERTIONS = [
  "the form of every nonce",
  "no two critic calls share a nonce",
  "time values do not decrease where the reference's do not",
  "a hash of the path class is right for its own input",
  "a hash of the implementation class is consistent with what it covers",
] as const;
export type AssertionName = (typeof ASSERTIONS)[number];

/** The form a nonce must have: sixteen hexadecimal characters. */
export const NONCE_FORM = /^[0-9a-f]{16}$/;

/** One assertion that did not hold. */
export type AssertionFailure = {
  readonly assertion: AssertionName;
  readonly detail: string;
  /** The surface the failure is in, where it is in one. */
  readonly surface?: string;
};

/** A capture, as captured, for the assertions. */
export type CaptureForAssertions = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  readonly surfaces: Readonly<Record<string, unknown>>;
};

/** The form of every nonce (N-06 would hide it). */
export function assertNonceForm(capture: CaptureForAssertions): readonly AssertionFailure[] {
  const failures: AssertionFailure[] = [];
  for (const nonce of boundNoncesOf(capture.surfaces)) {
    if (!NONCE_FORM.test(nonce)) {
      failures.push({
        assertion: "the form of every nonce",
        detail: `${JSON.stringify(nonce)} is no nonce of the form of the reference (sixteen hexadecimal characters)`,
      });
    }
  }
  return Object.freeze(failures);
}

/**
 * The CALLS of a critic a capture holds, each with the nonce its prompt bound.
 *
 * A call is one record of the transcript, because F141-FR-011 writes exactly one
 * record per invocation; the nonce of the call is the one its prompt carries.
 * Counting OCCURRENCES of a nonce instead would be wrong: one call's nonce is in
 * its prompt, in the verdict line it asked for, in the standard output of the run
 * and in the feedback file of the attempt, so a correct run holds every nonce many
 * times over.
 */
export function criticCallsWithANonce(
  capture: CaptureForAssertions,
): readonly { readonly role: string; readonly call: number; readonly nonce: string }[] {
  // The surface `transcript` IS the list of transport-neutral records
  // (`src/capture/index.ts`), one per invocation.
  const records = capture.surfaces["transcript"] as
    readonly { role?: unknown; call?: unknown; prompt?: unknown }[] | undefined;
  if (!Array.isArray(records)) return Object.freeze([]);
  const calls: { role: string; call: number; nonce: string }[] = [];
  for (const record of records) {
    const role = String(record.role ?? "");
    if (role !== "critic") continue;
    const nonce = boundNoncesOf(record.prompt)[0];
    if (nonce === undefined) continue;
    calls.push({ role, call: Number(record.call ?? 0), nonce });
  }
  return Object.freeze(calls);
}

/**
 * No two critic calls share a nonce. One call is one record of the transcript
 * (F141-FR-011), so two records that carry the same nonce are two calls with one
 * nonce, which is what the assertion forbids.
 *
 * Where the scenario compares no transcript there are no calls to tell apart and
 * nothing is asserted: see the comment on the second half of the function.
 */
export function assertNoSharedNonce(capture: CaptureForAssertions): readonly AssertionFailure[] {
  const calls = criticCallsWithANonce(capture);
  const byNonce = new Map<string, number[]>();
  if (calls.length > 0) {
    for (const call of calls) {
      byNonce.set(call.nonce, [...(byNonce.get(call.nonce) ?? []), call.call]);
    }
    return Object.freeze(
      [...byNonce.entries()]
        .filter(([, indices]) => indices.length > 1)
        .map(([nonce, indices]) => ({
          assertion: "no two critic calls share a nonce" as const,
          detail:
            `the nonce ${nonce} is the nonce of the critic calls ${indices.join(", ")}; one nonce ` +
            `belongs to one call`,
        })),
    );
  }
  // No transcript, no calls to tell apart: the capture holds the nonce of each
  // call in its prompt, its verdict line, the standard output and the feedback
  // file, and counting those occurrences would call every correct run a failure.
  // A scenario that compares a critic at all compares the surface `transcript`
  // (§O.4), so this is the case of a scenario with no critic, where there is
  // nothing to assert.
  return Object.freeze([]);
}

/** Every line of a capture that binds a nonce to a verdict. */
export function verdictLinesOf(value: Readonly<Record<string, unknown>>): readonly string[] {
  const lines = new Set<string>();
  for (const text of collect(value, (node) => (typeof node === "string" ? node : undefined))) {
    for (const line of text.split("\n")) {
      if (/VERDICT\s+[0-9a-f]{16}/.test(line)) lines.add(line);
    }
  }
  return Object.freeze([...lines]);
}

/**
 * Time values do not decrease where the reference's do not (N-04 would hide it).
 * The assertion is made on the PAIR of captures, because "where the reference's do
 * not" is a statement about the reference: a side whose times run backwards where
 * the reference's run forwards has reordered something.
 */
export function assertTimeOrder(
  reference: CaptureForAssertions,
  other: CaptureForAssertions,
  surface: string,
): readonly AssertionFailure[] {
  const theirs = timeValuesOf(reference.surfaces[surface]);
  const ours = timeValuesOf(other.surfaces[surface]);
  const decreases = (values: readonly string[]): number => {
    let count = 0;
    for (let i = 1; i < values.length; i += 1) {
      if ((values[i] as string) < (values[i - 1] as string)) count += 1;
    }
    return count;
  };
  const referenceDecreases = decreases(theirs);
  const otherDecreases = decreases(ours);
  if (referenceDecreases === 0 && otherDecreases > 0) {
    return Object.freeze([
      {
        assertion: "time values do not decrease where the reference's do not" as const,
        surface,
        detail:
          `the times of the reference do not decrease and the times of the ${other.side} decrease ` +
          `${String(otherDecreases)} time(s) on the surface ${surface}`,
      },
    ]);
  }
  return Object.freeze([]);
}

/** A hash of the path class is right for its own input. */
export function assertPathClassHashes(capture: CaptureForAssertions): readonly AssertionFailure[] {
  return Object.freeze(
    pathClassMismatches(capture.surfaces).map((bad) => ({
      assertion: "a hash of the path class is right for its own input" as const,
      surface: bad.at,
      detail: `the hash ${bad.hash} is not the hash of its own input, which is ${bad.recomputed}`,
    })),
  );
}

/** A hash of the implementation class is consistent with what it covers. */
export function assertImplementationClassHashes(
  capture: CaptureForAssertions,
): readonly AssertionFailure[] {
  return Object.freeze(
    implementationClassInconsistencies(capture.surfaces).map((bad) => ({
      assertion: "a hash of the implementation class is consistent with what it covers" as const,
      detail: `${bad.covers} is covered by ${String(bad.hashes.length)} different hashes: ${bad.hashes.join(", ")}`,
    })),
  );
}

/** Every nonce a capture holds, for a caller that wants to see them. */
export { noncesOf };

/**
 * Every assertion of F141-FR-021, on the captures as they were captured. Returns
 * the failures; a failure gives `different` on the surface it is in, and on every
 * surface where it names none.
 */
export function assertBeforeNormalization(
  reference: CaptureForAssertions,
  other: CaptureForAssertions,
): readonly AssertionFailure[] {
  const failures: AssertionFailure[] = [];
  for (const capture of [reference, other]) {
    failures.push(...assertNonceForm(capture));
    failures.push(...assertNoSharedNonce(capture));
    failures.push(...assertPathClassHashes(capture));
    failures.push(...assertImplementationClassHashes(capture));
  }
  for (const surface of Object.keys(reference.surfaces)) {
    if (!(surface in other.surfaces)) continue;
    failures.push(...assertTimeOrder(reference, other, surface));
  }
  return Object.freeze(failures);
}
