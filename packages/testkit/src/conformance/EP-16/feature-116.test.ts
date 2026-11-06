/**
 * T065 (feature 116) — the behaviour cases the content owner of EP-16 adds to
 * the conformance suite of the point, beside the contract-level suite of
 * feature 100 (`contract.test.ts`, CT-100-210).
 *
 * The sample profile of the fictional toolchain, given in a test overlay
 * (`../../samples/EP-16/overlay.ts`), reaches the loader of feature 116 as
 * user configuration would: the key `toolchains.<id>` is accepted from user
 * configuration only, and the profile it carries changes the protected set of
 * a fixture with no file of the product changed (F116-FR-013, F116-FR-014).
 *
 * The five standing checks of §A.4 live in `contract.test.ts` of this folder;
 * this file adds the owner's behaviour cases only.
 */
import assert from "node:assert/strict";
import {
  KNOWN_PROFILE_FIELDS,
  TOOLCHAINS_KEY_PREFIX,
  classAPatternsOf,
  loadToolchainProfiles,
  logicalNameOf,
  validateProfile,
} from "@specstride/integrity";
import { PROFILE, TOOLCHAIN } from "../../samples/EP-16/index.ts";
import { ADDS_TO_THE_PROTECTED_SET, TEST_OVERLAY } from "../../samples/EP-16/overlay.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";
import { implementation } from "./contract.test.ts";

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-116-13",
    title:
      "a toolchain profile is data with the content of F116-FR-013; it validates against specstride.toolchain/1; an unknown field is ignored with a finding; a profile that does not validate is refused at load and treated as absent (F116-FR-013)",
    level: "behaviour",
    proves: ["F116-FR-013"],
    run() {
      // The content: every field of F116-FR-013 is known to the reader.
      for (const field of [
        "detect",
        "classA",
        "testFiles",
        "caches",
        "userConfig",
        "suppressionMarkers",
        "executables",
        "effectiveConfig",
        "workerSeeds",
        "workerEnv",
      ]) {
        assert.ok((KNOWN_PROFILE_FIELDS as readonly string[]).includes(field));
      }
      // The sample profile of the fictional toolchain validates.
      const outcome = validateProfile(PROFILE);
      assert.equal(outcome.ok, true, JSON.stringify(outcome.findings));
      assert.deepEqual(outcome.unknownFields, []);
      // An unknown field is ignored with a finding; the profile still loads.
      const withUnknown = validateProfile({ ...PROFILE, futureField: true });
      assert.equal(withUnknown.ok, true);
      assert.deepEqual(withUnknown.unknownFields, ["futureField"]);
      assert.ok(withUnknown.findings.some((f) => f.includes("futureField")));
      // A profile that does not validate is refused at load, treated as absent.
      const brokenProfile = {
        schema: "specstride.toolchain/1",
        id: "broken",
        version: "1",
      };
      const broken = validateProfile(brokenProfile);
      assert.equal(broken.ok, false);
      const loaded = loadToolchainProfiles({
        userConfig: { [`${TOOLCHAINS_KEY_PREFIX}broken`]: brokenProfile },
      });
      assert.deepEqual(
        loaded.profiles.filter((p) => p.profile.id === "broken"),
        [],
      );
    },
  },
  {
    id: "CT-116-14",
    title:
      "the key toolchains.<id> is accepted from user configuration only; project configuration, the environment and a flag are ignored; the fictional toolchain of the test overlay changes the protected set of a fixture, with no file of the product changed (F116-FR-014)",
    level: "behaviour",
    proves: ["F116-FR-014"],
    run() {
      // From user configuration: accepted, under `user:toolchain:<id>`.
      const loaded = loadToolchainProfiles({ userConfig: TEST_OVERLAY });
      const entry = loaded.profiles.find((p) => p.profile.id === TOOLCHAIN);
      assert.ok(entry);
      assert.equal(entry.source, "user");
      assert.equal(entry.logicalName, logicalNameOf(TOOLCHAIN));
      assert.deepEqual(
        loaded.usedProfiles.filter((p) => p.id === TOOLCHAIN),
        [{ id: TOOLCHAIN, version: "1" }],
      );
      // The profile changes the protected set of a fixture: the class A
      // patterns of the set grow by exactly what the profile adds.
      const without = classAPatternsOf([]);
      const withProfile = classAPatternsOf(
        // The loader returns the profile as the schema of feature 116 defines
        // it; the pattern reader reads only `classA`.
        loaded.profiles.map(
          (p) => p.profile as unknown as Parameters<typeof classAPatternsOf>[0][number],
        ),
      );
      for (const pattern of ADDS_TO_THE_PROTECTED_SET) {
        assert.ok(withProfile.includes(pattern));
        assert.ok(without.includes(pattern) === false);
      }
      // The same key in project configuration, in the environment and as a
      // flag is ignored, with a launch message and a doctor warning.
      const ignored = loadToolchainProfiles({
        projectConfig: TEST_OVERLAY,
        env: { SPECSTRIDE_TOOLCHAINS: JSON.stringify(TEST_OVERLAY) },
        flags: { toolchains: TEST_OVERLAY },
      });
      assert.deepEqual(
        ignored.profiles.filter((p) => p.profile.id === TOOLCHAIN),
        [],
      );
      assert.ok(ignored.launchMessages.some((m) => m.includes(`toolchains.${TOOLCHAIN}`)));
      assert.ok(ignored.doctorWarnings.some((w) => w.includes(`toolchains.${TOOLCHAIN}`)));
      // No file of the product changed: the overlay is data of the test tree.
    },
  },
]);

export const cases: readonly ConformanceCase[] = named;

export { implementation };
await casesAsTests("specstride.toolchain/1", implementation, cases);
