/**
 * T065 (feature 116, F116-FR-014) — the test overlay that carries the sample
 * profile of the fictional toolchain.
 *
 * "A profile for a fictional toolchain, given in a test overlay, MUST change
 * the protected set of a fixture with no file of the product changed"
 * (F116-FR-014). The overlay is the user configuration of the fixture: the
 * profile reaches the loader exactly as a consumer profile would, under the
 * key `toolchains.<id>`, and is stored under `user:toolchain:<id>`. The
 * overlay lives in the test tree ONLY; no core file names it.
 */
import { PROFILE, TOOLCHAIN } from "./index.ts";

/** The key of the user configuration of the fixture (F116-FR-014). */
export const TOOLCHAINS_KEY_PREFIX = "toolchains." as const;

/**
 * The overlay: the user configuration of the fixture, holding the sample
 * profile of the fictional toolchain under `toolchains.<id>`.
 */
export const TEST_OVERLAY: Readonly<Record<string, unknown>> = Object.freeze({
  [`${TOOLCHAINS_KEY_PREFIX}${TOOLCHAIN}`]: PROFILE,
});

/** The class A patterns the fictional profile adds to the protected set. */
export const ADDS_TO_THE_PROTECTED_SET: readonly string[] = PROFILE.classA;
