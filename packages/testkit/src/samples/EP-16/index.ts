/**
 * T123 — the sample implementation of EP-16, the toolchain profile, outside
 * the core, registered from the test tree (annex A, §A.4, F100-FR-018; annex
 * X, §X.10, F100-FR-222).
 *
 * A profile for a fictional toolchain in a test overlay, which §C.14 "Proving
 * test" names: it changes the protected set of a fixture. The point is DATA,
 * and the profile validates against `specstride.toolchain/1`, the schema
 * feature 116 delivers to the `contracts` package.
 *
 * T279 registers every sample of the test tree with the class `first-party`;
 * the sample therefore also carries its data and its schema id, so that the
 * suite of the point can register the same profile as a data implementation
 * and see the registry validate it.
 */
import { SCHEMA_ID, THE_ONE_COMMAND_A_PROFILE_MAY_NAME } from "@specstride/contracts/ep/toolchain";
import { validate } from "@specstride/contracts/records/compile";
import type { ToolchainProfile } from "@specstride/contracts/ep/toolchain";
import type { Implementation } from "../../conformance/frame.ts";

/** The fictional toolchain of the overlay. */
export const TOOLCHAIN = "sample-toolchain" as const;

/** The profile, as data. It names one command and no other (§C.14). */
export const PROFILE: ToolchainProfile = Object.freeze({
  schema: SCHEMA_ID,
  id: TOOLCHAIN,
  version: "1",
  detect: Object.freeze({ files: Object.freeze(["sample.toolchain.json"]) }),
  classA: Object.freeze(["sample.toolchain.json", "sample/checks/**"]),
  testFiles: Object.freeze(["sample/tests/**"]),
  caches: Object.freeze([
    Object.freeze({ path: ".sample-cache", disableEnv: Object.freeze({ SAMPLE_CACHE: "0" }) }),
  ]),
  userConfig: Object.freeze(["~/.config/sample/config.json"]),
  suppressionMarkers: Object.freeze(["sample-ignore"]),
  executables: Object.freeze(["sample"]),
  effectiveConfig: Object.freeze(["sample", "config", "--print"]),
  workerSeeds: Object.freeze(["sample/seed"]),
  workerEnv: Object.freeze({ SAMPLE_CACHE: ".sample-cache-<workerId>" }),
}) as unknown as ToolchainProfile;

/** The one command the profile names (§C.14, Guarantees of an implementation). */
export const THE_ONE_COMMAND = THE_ONE_COMMAND_A_PROFILE_MAY_NAME;

/** The profile adds these patterns to the protected set of a phase. */
export const ADDS_TO_THE_PROTECTED_SET = Object.freeze([
  "sample.toolchain.json",
  "sample/checks/**",
]);

/**
 * The point has no operation of its own (`operations` of its contract file is
 * empty): the profile is the whole implementation. The sample offers one
 * helper beside the point, `validateProfile`, so that the conformance suite
 * has something to call for the closed result set of a data point: the result
 * of validating the profile against `specstride.toolchain/1`.
 */
export const operations = Object.freeze({
  validateProfile(): boolean {
    return validate(SCHEMA_ID, PROFILE).ok;
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-16",
  pointId: "specstride.toolchain/1",
  id: "sample-toolchain-profile",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  schemaId: SCHEMA_ID,
  value: PROFILE,
  operations,
});

/** The same profile as a DATA implementation, which the registry validates. */
export const asData: Implementation = Object.freeze({
  ...implementation,
  id: "sample-toolchain-profile-as-data",
  implementationClass: "data",
});
