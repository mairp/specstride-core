/**
 * T122 — the conformance suite at contract level for EP-16, the toolchain
 * profile (annex C, §C.14): CT-100-210.
 *
 * Before the named case the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). EP-16 is DATA and has no operation,
 * so "the operations exist" holds over the empty list of its contract file,
 * and the closed result set is the schema `specstride.toolchain/1` the
 * content owner (116) delivers. Its behaviour cases go in this folder beside
 * this file.
 */
import assert from "node:assert/strict";
import {
  ACCEPTED_FROM,
  FAILURE_PATH,
  IS_DATA,
  OPERATIONS,
  POINT_ID,
  PROFILE_CONTENT,
  PROFILE_OUTPUTS,
  PROTECTED_SET_IS_DERIVED_AT_LAUNCH,
  REFUSED_AT_LOAD_WITH_A_DOCTOR_FINDING,
  SCHEMA_ID,
  THE_ONE_COMMAND_A_PROFILE_MAY_NAME,
  UNKNOWN_FIELD_IS_IGNORED_WITH_A_FINDING,
  WITHOUT_A_PROFILE,
} from "@specstride/contracts/ep/toolchain";
import { validate } from "@specstride/contracts/records/compile";
import {
  ADDS_TO_THE_PROTECTED_SET,
  PROFILE,
  asData,
  implementation,
} from "../../samples/EP-16/index.ts";
import { registryOf } from "../frame.ts";
import { standardCases } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-16" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-210",
    title:
      "a toolchain profile is data with the content of §C.14, accepted from the product and from user configuration, and the protected set of a phase is derived at launch from the profiles (F100-FR-110)",
    level: "contract",
    proves: ["F100-FR-110"],
    run() {
      assert.equal(IS_DATA, true);
      assert.deepEqual([...OPERATIONS], []);
      assert.equal(PROFILE_CONTENT.length, 7);
      assert.equal(PROFILE_OUTPUTS.length, 2);
      assert.deepEqual([...ACCEPTED_FROM], ["the product", "user configuration"]);
      // The profile validates against the schema feature 116 delivers.
      const result = validate(SCHEMA_ID, PROFILE);
      assert.equal(result.ok, true, result.ok ? "" : JSON.stringify(result.errors));
      // The registry validates a DATA implementation against its schema.
      const registry = registryOf(POINT_ID);
      const outcome = registry.register(asData);
      assert.equal(outcome.accepted, true, outcome.accepted ? "" : outcome.message);
      // A profile that does not validate is refused at load, and a refused
      // profile is treated as absent.
      const broken = { ...asData, id: "sample-toolchain-broken", value: { schema: SCHEMA_ID } };
      const refused = registry.register(broken);
      assert.equal(refused.accepted, false);
      if (!refused.accepted) assert.equal(refused.reason, "data-invalid");
      assert.equal(REFUSED_AT_LOAD_WITH_A_DOCTOR_FINDING, true);
      assert.match(FAILURE_PATH, /treated as absent/);
      // The profile names one command and no other.
      assert.deepEqual([...(PROFILE.effectiveConfig ?? [])], ["sample", "config", "--print"]);
      assert.match(THE_ONE_COMMAND_A_PROFILE_MAY_NAME, /one fixed argument list/);
      // The protected set of a phase is derived at launch from the profiles.
      assert.equal(PROTECTED_SET_IS_DERIVED_AT_LAUNCH, true);
      assert.deepEqual([...ADDS_TO_THE_PROTECTED_SET], [...PROFILE.classA]);
      assert.match(WITHOUT_A_PROFILE, /basic protection only/);
      assert.equal(UNKNOWN_FIELD_IS_IGNORED_WITH_A_FINDING, true);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-16/operations-exist",
      "EP-16/closed-result-sets",
      "EP-16/degradation",
      "EP-16/unknown-value-rule",
      "EP-16/behaviour-cases",
    ],
    {
      // EP-16 has no operation; its closed result set is the schema of its
      // data, so the case checks the data against the schema.
      resultSets: [
        {
          operation: "validateProfile",
          members: [(v: unknown) => v === true],
          calls: [[]],
        },
      ],
      throwingOperation: "validateProfile",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
