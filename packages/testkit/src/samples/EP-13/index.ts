/**
 * T140 — the sample implementation of EP-13 (annex A, §A.4, F100-FR-018).
 *
 * `registerSamples()` finds a sample by the name `index.ts` in its directory,
 * so this file is where the registration looks. The sample itself is
 * `memory-provider.ts`, which T017 of feature 122 names and which the
 * conformance suite of EP-13 drives.
 */
export * from "./memory-provider.ts";
