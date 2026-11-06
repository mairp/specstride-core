/**
 * T155 — the conformance suite at contract level for EP-01, the host port
 * (annex H, §H.1): CT-100-293, CT-100-294, CT-100-295, CT-100-296,
 * CT-100-297.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The capability table it compares
 * with is `data/host-capabilities.json`. The behaviour of EP-01 belongs to
 * feature 113; its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  CAPABILITIES,
  CLI_PROTOCOL_VERSION,
  CORE_GUARANTEES,
  DOCTOR_SKILL_ID,
  ERRORS,
  EXECUTABLE_VARIABLE,
  HOST_SKILL_IDS,
  IMPLEMENTATION_GUARANTEES,
  INSTALLS_OR_UPDATES_THE_CLI,
  INVOCATION_IS_CONSENT,
  OPERATIONS,
  OPTIONAL_OPERATIONS,
  POINT_ID,
  PROTOCOL_MISMATCH_EXIT_CODE,
  PROTOCOL_MISMATCH_LINE,
  THE_COMMENT_CANNOT_BYPASS,
  capabilityRows,
  fallbackOf,
  unknownCapabilityIsIgnored,
  unknownLogicalIdMessage,
} from "@specstride/contracts/ep/host";
import { declaredCapabilities, implementation } from "../../samples/EP-01/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-01" as const;

/** The budget of a host skill, in bytes, as annex G §G.5 measures it. */
const SKILL_BUDGET = 4096 as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-293",
    title:
      "a host package offers `describe`, `renderSkill`, `renderEntry` and `evalDriver.run`, may offer `renderStatusHooks`, declares every capability of the table of §H.1, and the product uses the declared fallback for each absent one (F100-FR-193)",
    level: "contract",
    proves: ["F100-FR-193"],
    async run(impl) {
      assert.deepEqual(
        [...OPERATIONS],
        ["describe", "renderSkill", "renderEntry", "renderStatusHooks", "evalDriver.run"],
      );
      assert.deepEqual([...OPTIONAL_OPERATIONS], ["renderStatusHooks"]);
      assert.deepEqual([...ERRORS], ["capability-absent", "budget-exceeded", "protocol-mismatch"]);
      // The capability table comes from `data/host-capabilities.json`.
      assert.deepEqual(
        capabilityRows.map((r) => r.capability),
        [...CAPABILITIES],
      );
      assert.equal(capabilityRows.length, 6);
      assert.deepEqual([...declaredCapabilities], [...CAPABILITIES]);
      const description = (operationOf(impl, "describe") as () => Record<string, unknown>)();
      for (const capability of CAPABILITIES) {
        assert.ok(capability in description, `the host declares no \`${capability}\``);
      }
      // Every capability has a declared fallback for when it is absent.
      for (const capability of CAPABILITIES) {
        assert.equal(typeof fallbackOf(capability), "string");
        assert.ok(fallbackOf(capability).length > 0);
      }
      assert.equal(fallbackOf("evals"), "The session-log driver");
      const results = await (
        operationOf(impl, "evalDriver.run") as (
          s: readonly unknown[],
        ) => Promise<readonly unknown[]>
      )([{ id: "c1", prompt: "run specstride", expected: "specstride" }]);
      assert.equal(results.length, 1);
      assert.equal((results[0] as { matched: boolean }).matched, true);
      assert.equal(CLI_PROTOCOL_VERSION, 1);
      assert.equal(CORE_GUARANTEES.length, 5);
    },
  },
  {
    id: "CT-100-294",
    title:
      "the product has the two host skills `specstride-run` and `specstride-reverse` and a doctor skill, and a host skill is a thin layer over the CLI (F100-FR-194)",
    level: "contract",
    proves: ["F100-FR-194"],
    run(impl) {
      assert.deepEqual([...HOST_SKILL_IDS], ["specstride-run", "specstride-reverse"]);
      assert.equal(DOCTOR_SKILL_ID, "specstride-doctor");
      const renderEntry = operationOf(impl, "renderEntry") as (id: string) => string;
      assert.equal(renderEntry("doctor"), "specstride doctor");
      // A host package reads no file of the product and names no path into
      // the product's source or state: the rendered artifact names neither.
      const artifact = (
        operationOf(impl, "renderSkill") as (s: unknown) => { content: string; path: string }
      )({
        logicalId: "specstride-run",
        body: "call `specstride launch`",
        references: [],
        budget: SKILL_BUDGET,
      });
      assert.equal(/packages\//.test(artifact.content), false);
      assert.equal(/\.specstride\//.test(artifact.content), false);
      assert.ok(IMPLEMENTATION_GUARANTEES[0]?.includes("reads no file of the product"));
    },
  },
  {
    id: "CT-100-295",
    title:
      "each host skill stays inside its token budget, and the build enforces it by measuring bytes (F100-FR-195)",
    level: "contract",
    proves: ["F100-FR-195"],
    run(impl) {
      const renderSkill = operationOf(impl, "renderSkill") as (s: unknown) => {
        bytes: number;
        content: string;
      };
      for (const logicalId of HOST_SKILL_IDS) {
        const artifact = renderSkill({
          logicalId,
          body: "a thin layer over the CLI",
          references: [],
          budget: SKILL_BUDGET,
        });
        assert.equal(artifact.bytes, Buffer.byteLength(artifact.content, "utf8"));
        assert.ok(artifact.bytes <= SKILL_BUDGET, `${logicalId} is over its budget`);
      }
    },
  },
  {
    id: "CT-100-296",
    title:
      "invoking the host skill `specstride-run` is the consumer's consent to launch, and the comment cannot bypass a launch check, the terms gate or a budget (F100-FR-196)",
    level: "contract",
    proves: ["F100-FR-196"],
    run() {
      assert.equal(INVOCATION_IS_CONSENT, true);
      assert.deepEqual(
        [...THE_COMMENT_CANNOT_BYPASS],
        ["a launch check", "the terms gate", "a budget"],
      );
      assert.ok(CORE_GUARANTEES.some((g) => g.includes("comment is stored with its hash")));
      assert.ok(IMPLEMENTATION_GUARANTEES.some((g) => g.includes("comment verbatim")));
    },
  },
  {
    id: "CT-100-297",
    title:
      "a host package never installs or updates the CLI without the consumer noticing, and on a mismatch it refuses with the line and the exit code of §H.1 (F100-FR-197)",
    level: "contract",
    proves: ["F100-FR-197"],
    run() {
      assert.equal(INSTALLS_OR_UPDATES_THE_CLI, false);
      assert.equal(
        PROTOCOL_MISMATCH_LINE,
        "[SPECSTRIDE-REFUSE] action=protocol reason=protocol-mismatch",
      );
      assert.equal(PROTOCOL_MISMATCH_EXIT_CODE, 4);
      assert.equal(EXECUTABLE_VARIABLE, "SPECSTRIDE_BIN");
      assert.ok(
        IMPLEMENTATION_GUARANTEES.some((g) =>
          g.includes("detects, reports and prints the command"),
        ),
      );
      // An unknown capability is ignored; an unknown logical id fails the build.
      assert.equal(unknownCapabilityIsIgnored("no-such-capability"), true);
      assert.equal(unknownCapabilityIsIgnored("hooks"), false);
      assert.match(unknownLogicalIdMessage("no-such-skill"), /fails/);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-01/operations-exist",
      "EP-01/closed-result-sets",
      "EP-01/degradation",
      "EP-01/unknown-value-rule",
      "EP-01/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "describe",
          members: [
            (v: unknown) =>
              CAPABILITIES.every((c) => c in (v as Record<string, unknown>)) &&
              Object.keys(v as Record<string, unknown>).every(
                (k) =>
                  k === "skillNaming" || k === "packagingForm" || !unknownCapabilityIsIgnored(k),
              ),
          ],
          calls: [[]],
        },
        {
          operation: "renderEntry",
          members: [(v: unknown) => typeof v === "string" && v.startsWith("specstride ")],
          calls: [["doctor"], ["status"]],
        },
      ],
      throwingOperation: "renderSkill",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
