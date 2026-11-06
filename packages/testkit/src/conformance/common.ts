/**
 * The five checks every conformance suite at contract level makes (annex A,
 * §A.4). Each suite of `src/conformance/EP-nn/contract.test.ts` builds its
 * cases from these:
 *
 *  - the operations of the point exist on the implementation;
 *  - results stay inside the closed result sets the point states;
 *  - a throwing implementation degrades to the path the point documents under
 *    "Failure of an implementation" (F100-FR-019);
 *  - the unknown-value rule of the point, with the default rule of
 *    F100-FR-021 as the fallback;
 *  - the behaviour cases are added by the content owner: the suite states
 *    where they go and which owner writes them, and the folder of the point
 *    is the place.
 *
 * The frame is feature 100's; the behaviour of each point belongs to the
 * content owner named in the annex.
 */
import assert from "node:assert/strict";
import { EXTENSION_POINT_SUB_HEADINGS } from "@specstride/contracts/ep/extension-point";
import {
  ROOT,
  loadExtensionPointContract,
  loadExtensionPointIndex,
  type Implementation,
} from "./frame.ts";
import {
  guardedCall,
  holdsNoVerdictExitCodeOrStopReason,
  eventIsAnEnvelope,
  plainerPathOf,
  unknownValueRuleInForce,
  applyDefaultUnknownValueRule,
} from "./degrade.ts";
import type { ConformanceCase } from "./run.ts";

/** A fixed event context, so that the cases are pure. */
export const EVENT_CONTEXT = Object.freeze({
  seq: 1,
  ts: "2026-10-01T00:00:00.000Z",
  runId: "run-conformance",
  launchId: "launch-conformance",
});

/** The case "the operations exist" (annex A, §A.4). */
export function operationsExist(ep: string, caseId: string): ConformanceCase {
  return {
    id: caseId,
    title: `the operations of ${ep} exist on the implementation`,
    level: "contract",
    proves: ["F100-FR-017"],
    run(implementation: Implementation) {
      const entry = loadExtensionPointIndex().find((e) => e.ep === ep);
      assert.ok(entry !== undefined, `the index holds no ${ep}`);
      const contract = loadExtensionPointContract(ep);
      assert.deepEqual([...contract.operations], [...entry.operations]);
      for (const operation of entry.operations) {
        assert.equal(
          typeof operationOf(implementation, operation),
          "function",
          `the implementation of ${ep} offers no operation \`${operation}\``,
        );
      }
    },
  };
}

/** The operation of an implementation, by its dotted name (`evalDriver.run`). */
export function operationOf(implementation: Implementation, operation: string): unknown {
  const ops = implementation.operations as Readonly<Record<string, unknown>> | undefined;
  // A name that holds a dot may be one key (`route.decided` of EP-06) or a
  // path into a nested object (`evalDriver.run` of EP-01); the whole name wins.
  if (ops !== undefined && operation in ops) return ops[operation];
  let value: unknown = ops;
  for (const part of operation.split(".")) {
    if (value === undefined || value === null) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/** One closed result set of a point: the operation and the members. */
export type ResultSet = {
  readonly operation: string;
  readonly members: readonly unknown[];
  /** The arguments with which the case calls the operation. */
  readonly calls: readonly (readonly unknown[])[];
};

/** The case "results stay inside the closed result sets" (annex A, §A.4). */
export function resultsInsideTheClosedSets(
  ep: string,
  caseId: string,
  sets: readonly ResultSet[],
): ConformanceCase {
  return {
    id: caseId,
    title: `every result of ${ep} stays inside the closed result set of its operation`,
    level: "contract",
    proves: ["F100-FR-017", "F100-FR-021"],
    async run(implementation: Implementation) {
      assert.ok(sets.length > 0, `the suite of ${ep} names no closed result set`);
      for (const set of sets) {
        const operation = operationOf(implementation, set.operation) as
          ((...args: unknown[]) => unknown) | undefined;
        assert.equal(typeof operation, "function", `no operation \`${set.operation}\``);
        for (const args of set.calls) {
          const value = await (operation as (...a: unknown[]) => unknown)(...args);
          assert.ok(
            set.members.some((m) => sameMember(m, value)),
            `${ep}.${set.operation}(${JSON.stringify(args)}) returned ` +
              `${JSON.stringify(value)}, outside {${set.members.map((m) => JSON.stringify(m)).join(", ")}}`,
          );
        }
      }
    },
  };
}

function sameMember(member: unknown, value: unknown): boolean {
  if (typeof member === "function") return (member as (v: unknown) => boolean)(value);
  return JSON.stringify(member) === JSON.stringify(value);
}

/** The case "a throwing implementation degrades to the documented path". */
export function throwingDegrades(ep: string, caseId: string, operation: string): ConformanceCase {
  return {
    id: caseId,
    title: `a throwing implementation of ${ep} degrades to the documented path, with an event and no verdict, code or stop reason`,
    level: "contract",
    proves: ["F100-FR-019"],
    async run(implementation: Implementation) {
      const outcome = await guardedCall(
        () => {
          throw new Error(`the implementation of ${ep} threw`);
        },
        {
          ep,
          implementationId: implementation.id,
          operation,
          event: EVENT_CONTEXT,
        },
      );
      assert.equal(outcome.degraded, true);
      if (!outcome.degraded) return;
      assert.equal(outcome.cause, "threw");
      assert.equal(outcome.plainerPath, plainerPathOf(ep));
      assert.ok(outcome.plainerPath.length > 0, `${ep} documents no plainer path`);
      assert.equal(eventIsAnEnvelope(outcome), true);
      assert.equal(holdsNoVerdictExitCodeOrStopReason(outcome), true);
    },
  };
}

/** The case "the unknown-value rule" (F100-FR-021). */
export function unknownValueRule(ep: string, caseId: string): ConformanceCase {
  return {
    id: caseId,
    title: `the unknown-value rule of ${ep} holds, with the default rule of F100-FR-021 as the fallback`,
    level: "contract",
    proves: ["F100-FR-021"],
    run() {
      const inForce = unknownValueRuleInForce(ep);
      assert.equal(inForce.ep, ep);
      // Every point of the index states its own rule; the default is the
      // fallback of every point and holds for the three cases of F100-FR-021.
      const field = applyDefaultUnknownValueRule("unknown-field", "x", `${ep} record`);
      assert.equal(field.ignoredByAReader, true);
      assert.equal(field.keptByACopyingWriter, true);
      const closed = applyDefaultUnknownValueRule("unknown-closed-member", "nope", `${ep} results`);
      assert.equal(closed.refused, true);
      assert.match(closed.message ?? "", /nope/);
      assert.match(closed.message ?? "", new RegExp(`${ep} results`));
      const open = applyDefaultUnknownValueRule(
        "unknown-open-member",
        "nope",
        `${ep} registry`,
        true,
      );
      assert.equal(open.refused, false);
      assert.equal(open.resolvedThroughTheRegistry, true);
    },
  };
}

/** The case "the behaviour cases are added by the content owner". */
export function behaviourCasesBelongToTheOwner(ep: string, caseId: string): ConformanceCase {
  return {
    id: caseId,
    title: `the behaviour cases of ${ep} are added by the content owner, in the folder of the point`,
    level: "contract",
    proves: ["F100-FR-017"],
    run() {
      const contract = loadExtensionPointContract(ep);
      const owner = contract.sections["Content owner"];
      assert.ok(
        owner !== undefined && owner.join(" ").trim().length > 0,
        `${ep} names no content owner`,
      );
      const proving = contract.sections["Proving test"];
      assert.ok(
        proving !== undefined && proving.join(" ").trim().length > 0,
        `${ep} names no proving test`,
      );
      for (const heading of EXTENSION_POINT_SUB_HEADINGS) {
        assert.ok(
          heading in contract.sections,
          `the contract file of ${ep} holds no sub-heading "${heading}" (annex A, §A.4)`,
        );
      }
      // The folder of the point is where the owner's behaviour cases go; the
      // frame runs every module of the folder that exports `cases`.
      assert.equal(BEHAVIOUR_CASES_FOLDER(ep), `packages/testkit/src/conformance/${ep}/`);
    },
  };
}

/** The folder in which the content owner of a point adds its behaviour cases. */
export function BEHAVIOUR_CASES_FOLDER(ep: string): string {
  return `packages/testkit/src/conformance/${ep}/`;
}

/**
 * The five cases every suite at contract level makes, with the case ids the
 * task of the point gives. A suite that has more ids than five adds its own
 * cases after these.
 */
export function standardCases(
  ep: string,
  ids: readonly string[],
  options: { readonly resultSets: readonly ResultSet[]; readonly throwingOperation: string },
): readonly ConformanceCase[] {
  const [a, b, c, d, e] = ids;
  const cases: ConformanceCase[] = [];
  if (a !== undefined) cases.push(operationsExist(ep, a));
  if (b !== undefined) cases.push(resultsInsideTheClosedSets(ep, b, options.resultSets));
  if (c !== undefined) cases.push(throwingDegrades(ep, c, options.throwingOperation));
  if (d !== undefined) cases.push(unknownValueRule(ep, d));
  if (e !== undefined) cases.push(behaviourCasesBelongToTheOwner(ep, e));
  return Object.freeze(cases);
}

export { ROOT };
