/**
 * T259 — the static test "Profile" (annex X, §X.7; F100-FR-211; F100-SC-006;
 * quickstart.md scenario 3, the row "Profile").
 *
 * Every registered switch has a row of the profile with a value under
 * `parity`, and every row's keys are configuration keys. The second suite is
 * the profile with row 1 set to `micro` and nothing else changed. A switch
 * without a row fails the build.
 */
import {
  applySecondSuite,
  profileRows,
  rowOfKey,
  SECOND_SUITE_ROW,
  SECOND_SUITE_VALUE,
  type ProfileRow,
} from "@specstride/contracts/profile/parity";
import { registeredSwitches, type RegisteredSwitch } from "@specstride/contracts/profile/switches";
import { finding, type CheckOptions, type Finding, type StaticCheck } from "./kit.ts";

/** The data file the profile lives in. */
export const PROFILE_FILE = "packages/contracts/data/parity-profile.json";

/** A configuration key: dotted segments of letters, digits, hyphens, underscores. */
export const CONFIGURATION_KEY = /^[a-z][A-Za-z0-9_]*(?:\.[a-z<][A-Za-z0-9_<>-]*)*$/;

/**
 * F100-FR-211 — every switch of the product has a value in the profile. A
 * switch a package registered without a row fails the build.
 */
export function checkRegisteredSwitches(
  switches: readonly RegisteredSwitch[] = registeredSwitches(),
): readonly Finding[] {
  const findings: Finding[] = [];
  for (const registered of switches) {
    const row = rowOfKey(registered.key);
    if (row === undefined) {
      findings.push(
        finding(
          PROFILE_FILE,
          0,
          `the switch \`${registered.key}\`, registered by feature ${registered.owner}, ` +
            `has no row in the \`parity\` profile; a switch without a row fails the ` +
            `build (F100-FR-211)`,
          registered.key,
        ),
      );
      continue;
    }
    if (row.parity === "") {
      findings.push(
        finding(
          PROFILE_FILE,
          0,
          `row ${row.number} of the \`parity\` profile holds no value under \`parity\` ` +
            `for the switch \`${registered.key}\` (F100-FR-211)`,
          registered.key,
        ),
      );
    }
  }
  return Object.freeze(findings);
}

/** F100-FR-211 — every row's keys are configuration keys, and every row has a value. */
export function checkProfileRows(rows: readonly ProfileRow[] = profileRows): readonly Finding[] {
  const findings: Finding[] = [];
  for (const row of rows) {
    if (row.parity === "") {
      findings.push(
        finding(
          PROFILE_FILE,
          0,
          `row ${row.number} ("${row.switch}") holds no value under \`parity\` ` + `(F100-FR-211)`,
          String(row.number),
        ),
      );
    }
    for (const key of row.keys) {
      if (!CONFIGURATION_KEY.test(key)) {
        findings.push(
          finding(
            PROFILE_FILE,
            0,
            `row ${row.number} names "${key}", which is no configuration key ` + `(F100-FR-211)`,
            key,
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/**
 * F100-FR-211 — the second suite of the oracle is the profile `parity` with
 * row 1 set to `micro` and nothing else changed.
 */
export function checkSecondSuite(): readonly Finding[] {
  const findings: Finding[] = [];
  const row1 = profileRows.find((r) => r.number === SECOND_SUITE_ROW);
  if (row1 === undefined) {
    return Object.freeze([
      finding(PROFILE_FILE, 0, `the profile holds no row ${SECOND_SUITE_ROW} (F100-FR-211)`),
    ]);
  }
  const first = applySecondSuite();
  for (const key of row1.keys) {
    if (first.config[key] !== SECOND_SUITE_VALUE) {
      findings.push(
        finding(
          PROFILE_FILE,
          0,
          `the second suite does not set \`${key}\` to \`${SECOND_SUITE_VALUE}\` ` +
            `(F100-FR-211)`,
          key,
        ),
      );
    }
  }
  // Nothing else is changed: every other key keeps its value under `parity`.
  for (const row of profileRows) {
    if (row.number === SECOND_SUITE_ROW) continue;
    for (const key of row.keys) {
      if (first.config[key] !== row.parity) {
        findings.push(
          finding(
            PROFILE_FILE,
            0,
            `the second suite changes \`${key}\` as well as row ${SECOND_SUITE_ROW}; ` +
              `nothing else is changed (F100-FR-211)`,
            key,
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers (quickstart.md scenario 3, "Profile"). */
export const profileCheck: StaticCheck = {
  name: "Profile",
  covers: ["F100-FR-211", "F100-FR-225", "F100-SC-006"],
  run(_options: CheckOptions = {}) {
    return Object.freeze([
      ...checkRegisteredSwitches(),
      ...checkProfileRows(),
      ...checkSecondSuite(),
    ]);
  },
};

export default profileCheck;
