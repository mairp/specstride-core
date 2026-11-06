/**
 * T003 — the types of `src/types.ts`, observed from outside the module.
 *
 * What is proved here, in the order of the task: the types of the plan, of a
 * write scope, of a group, of the verdict of the audits, and the five closed
 * sets.
 *
 * The five sets are proved against both authorities at once, through
 * `closedSetDrift()`: this feature's `data/closed-sets.json` (the copy T002
 * made of `specs/142-parallel-units/contracts/closed-sets.json`) and the rows
 * 60, 61, 63, 185 and 186 of annex X §X.6 in `@specstride/contracts`. The
 * table of the section "Closed sets" of `spec.md` is read here a second time,
 * directly, so that the tuples of `src/types.ts` are tied to the
 * specification and not only to the JSON beside them.
 *
 * The plan, the scope, the group and the verdict are types, which carry no
 * run-time value of their own. They are proved the only way a type can be:
 * every one is inhabited by a value built here and checked field by field,
 * the type annotation makes `npm run typecheck` the second half of the proof,
 * and the functions the module offers over those types — `prefixFormBroken`,
 * `tasksNotPlacedExactlyOnce`, `refusalOf` and `integrateGroupRequestOf` —
 * are exercised on them.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { rowOf } from "@specstride/contracts/enums";
import { DIRECTIVES } from "@specstride/contracts/ep/loop-layer";
import type { IntegrateGroupRequest } from "@specstride/contracts/ep/loop-layer";
import { CHANGE_KINDS } from "@specstride/contracts/ep/tree-store";

import {
  ABSENT_SCOPE_MEANS,
  ADMISSION_CHECKS,
  AUDITS,
  CLOSED_BY,
  CLOSED_SET_KEYS,
  CLOSED_SET_MEMBERS,
  CLOSED_SET_NAMES,
  CLOSED_SET_ROWS,
  CLOSED_SET_UNKNOWN_VALUE,
  DELTA_REFUSAL_REASONS,
  FAILED_GROUPS_BEFORE_THE_LAYER_IS_OFF,
  FALLBACK_REASONS,
  GROUP_FINGERPRINT_LETTERS,
  GROUP_FINGERPRINT_STAGES,
  GROUP_MIN_TASKS,
  LAYER_OFF_FOR_ATTEMPT_REASONS,
  LAYER_OFF_FOR_RUN_REASONS,
  LAYER_OFF_REASONS,
  OWNER,
  PARALLEL_PLAN_SCHEMA,
  PREFIX_FORM,
  SCOPE_SOURCES,
  SINGLE_WRITER_FILES,
  WORKERS_DEFAULT,
  WORKERS_MAX_DEFAULT,
  closedSetDrift,
  integrateGroupRequestOf,
  isAccepted,
  isAdmissionCheck,
  isDeltaRefusalReason,
  isFallbackReason,
  isLayerOffReason,
  isScopeSource,
  layerOffScopeOf,
  prefixFormBroken,
  refusalOf,
  tasksNotPlacedExactlyOnce,
} from "../src/types.ts";
import type {
  AuditVerdict,
  CandidateTask,
  Delta,
  Group,
  KeptUnitOfWork,
  ParallelPlan,
  PhasePlan,
  PlannedGroup,
  SerialTask,
  Worker,
  WorkerVerdict,
  WriteScope,
} from "../src/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url)); // packages/layer-parallel/test
const PKG = dirname(HERE);
const ROOT = dirname(dirname(PKG));
const SPEC = join(ROOT, "specs/142-parallel-units/spec.md");

/* ------------------------------------------------------------------ *
 * The five closed sets.
 * ------------------------------------------------------------------ */

test("T003 the five closed sets: no drift from `data/closed-sets.json` or from annex X §X.6", () => {
  const drift = closedSetDrift();
  assert.deepEqual(
    drift.map((d) => `${d.set}/${d.authority}: ${d.detail}`),
    [],
  );
  assert.equal(CLOSED_SET_KEYS.length, 5);
});

test("T003 the five closed sets are rows 60, 61, 63, 185 and 186, owned by 142 and closed by design", () => {
  assert.deepEqual(
    CLOSED_SET_KEYS.map((k) => CLOSED_SET_ROWS[k]),
    [60, 61, 63, 185, 186],
  );
  assert.equal(OWNER, "142");
  assert.equal(CLOSED_BY, "design");
  for (const key of CLOSED_SET_KEYS) {
    const row = rowOf(CLOSED_SET_ROWS[key]);
    assert.ok(row !== undefined, `annex X §X.6 holds row ${CLOSED_SET_ROWS[key]}`);
    assert.equal(row.owner, OWNER, CLOSED_SET_NAMES[key]);
    assert.equal(row.closedBy.toLowerCase(), CLOSED_BY, CLOSED_SET_NAMES[key]);
    assert.deepEqual([...row.literals], [...CLOSED_SET_MEMBERS[key]], CLOSED_SET_NAMES[key]);
    // The unknown-value cell of the annex and the sentence this module keeps
    // say the same thing, read without case.
    assert.equal(row.unknownValue.toLowerCase(), CLOSED_SET_UNKNOWN_VALUE[key]);
  }
});

test("T003 the members of the five sets are those of the table `Closed sets` of spec.md", () => {
  const spec = readFileSync(SPEC, "utf8");
  const section = spec.slice(spec.indexOf("\n## Closed sets"));
  const rowsOfTheTable = section
    .split("\n")
    .filter((l) => l.startsWith("| "))
    .map((l) => l.split("|").map((c) => c.trim()));
  /** The members cell of the row of the table whose "Row" column is `row`. */
  const membersOfRow = (row: number): string[] => {
    const found = rowsOfTheTable.find((cells) => cells[2] === String(row));
    assert.ok(found !== undefined, `spec.md names row ${row} in the table "Closed sets"`);
    return [...(found[3] ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);
  };
  assert.deepEqual(membersOfRow(60), [...FALLBACK_REASONS]);
  assert.deepEqual(membersOfRow(61), [...ADMISSION_CHECKS]);
  assert.deepEqual(membersOfRow(63), [...DELTA_REFUSAL_REASONS]);
  assert.deepEqual(membersOfRow(185), [...LAYER_OFF_REASONS]);
  assert.deepEqual(membersOfRow(186), [...SCOPE_SOURCES]);
});

test("T003 row 185 is split by how far the switch reaches, and nothing else is a member", () => {
  assert.deepEqual(
    [...LAYER_OFF_FOR_ATTEMPT_REASONS],
    ["group-failures", "harness-error", "unchecked", "missing-object", "ledger", "check-budget"],
  );
  assert.deepEqual([...LAYER_OFF_FOR_RUN_REASONS], ["plan-hash", "apply-incomplete"]);
  for (const reason of LAYER_OFF_FOR_ATTEMPT_REASONS) {
    assert.equal(layerOffScopeOf(reason), "attempt", reason);
  }
  for (const reason of LAYER_OFF_FOR_RUN_REASONS) {
    assert.equal(layerOffScopeOf(reason), "run", reason);
  }
  assert.equal(layerOffScopeOf("no-such-reason"), undefined);
  assert.equal(FAILED_GROUPS_BEFORE_THE_LAYER_IS_OFF, 2);
});

test("T003 each set has a guard that admits its members and refuses everything else", () => {
  const cases: readonly [(v: string) => boolean, readonly string[]][] = [
    [isFallbackReason, FALLBACK_REASONS],
    [isAdmissionCheck, ADMISSION_CHECKS],
    [isDeltaRefusalReason, DELTA_REFUSAL_REASONS],
    [isLayerOffReason, LAYER_OFF_REASONS],
    [isScopeSource, SCOPE_SOURCES],
  ];
  for (const [guard, members] of cases) {
    for (const member of members) assert.equal(guard(member), true, member);
    for (const outside of ["", "not-a-member", "SCOPE", "scope "]) {
      if ((members as readonly string[]).includes(outside)) continue;
      assert.equal(guard(outside), false, `${outside} is outside the set`);
    }
  }
});

/* ------------------------------------------------------------------ *
 * The write scope.
 * ------------------------------------------------------------------ */

test("T003 a write scope is prefixes with the source it came from, and an absent list is the whole tree", () => {
  const fromTheConsumer: WriteScope = { prefixes: ["src/a", "docs/a.md"], source: "consumer" };
  const fromTheTask: WriteScope = { prefixes: ["src/b"], source: "task-text", caseFolded: false };
  const absent: WriteScope = { prefixes: [], source: "task-text" };
  assert.equal(fromTheConsumer.source, "consumer");
  assert.equal(isScopeSource(fromTheTask.source), true);
  assert.equal(absent.prefixes.length, 0);
  assert.match(ABSENT_SCOPE_MEANS, /the whole tree/);
  assert.equal(SCOPE_SOURCES.length, 2);
});

test("T003 the form of a prefix: the four rules of F142-FR-009, and which one a prefix breaks", () => {
  assert.equal(PREFIX_FORM.length, 4);
  for (const good of ["src", "src/a", "src/a/b.ts", "a"]) {
    assert.equal(prefixFormBroken(good), undefined, good);
  }
  assert.equal(prefixFormBroken("../src"), "no parent segment");
  assert.equal(prefixFormBroken("src/../etc"), "no parent segment");
  assert.equal(prefixFormBroken("/src"), "no absolute path");
  assert.equal(prefixFormBroken("./src"), "no leading current-directory segment");
  assert.equal(prefixFormBroken("src/"), "no trailing separator");
});

/* ------------------------------------------------------------------ *
 * The plan.
 * ------------------------------------------------------------------ */

const candidate = (id: string, prefix: string): CandidateTask => ({
  id,
  scope: { prefixes: [prefix], source: "task-text" },
  checks: ADMISSION_CHECKS.map((check) => ({ check, passed: true, detail: "" })),
});

const group: PlannedGroup = { ordinal: 1, phase: 3, tasks: ["T101", "T102"] };
const serial: SerialTask = { id: "T103", reason: "headroom" };
const phasePlan: PhasePlan = {
  phase: 3,
  groups: [group],
  tasks: [candidate("T101", "src/a"), candidate("T102", "src/b"), candidate("T103", "src/c")],
  serial: [serial],
  ceiling: 1.33,
};
const plan: ParallelPlan = {
  schema: PARALLEL_PLAN_SCHEMA,
  runId: "run-0001",
  hash: "f".repeat(64),
  workers: WORKERS_DEFAULT,
  phases: [phasePlan],
  fallback: null,
};

test("T003 the plan carries the fields of annex D §D.3 and the schema of feature 100", () => {
  assert.equal(plan.schema, "specstride.parallel-plan/1");
  assert.equal(PARALLEL_PLAN_SCHEMA, "specstride.parallel-plan/1");
  assert.equal(typeof plan.runId, "string");
  assert.equal(plan.hash.length, 64);
  assert.equal(plan.workers, 2);
  assert.equal(WORKERS_DEFAULT, 2);
  assert.equal(WORKERS_MAX_DEFAULT, 4);
  assert.equal(plan.fallback, null);
  const off: ParallelPlan = { ...plan, fallback: "no-group" };
  assert.equal(isFallbackReason(off.fallback ?? ""), true);
  assert.deepEqual(
    plan.phases.map((p) => p.phase),
    [3],
  );
  assert.equal(phasePlan.ceiling > 1, true);
});

test("T003 a candidate task carries its scope and the verdict of every admission check", () => {
  const first = phasePlan.tasks[0];
  assert.ok(first !== undefined);
  assert.equal(first.checks.length, ADMISSION_CHECKS.length);
  assert.deepEqual(
    first.checks.map((c) => c.check),
    [...ADMISSION_CHECKS],
  );
  for (const verdict of first.checks) {
    assert.equal(isAdmissionCheck(verdict.check), true);
    assert.equal(typeof verdict.passed, "boolean");
    assert.equal(typeof verdict.detail, "string");
  }
  assert.equal(isAdmissionCheck(serial.reason), true);
});

test("T003 a group holds at least two consecutive tasks of one phase", () => {
  assert.equal(GROUP_MIN_TASKS, 2);
  assert.ok(group.tasks.length >= GROUP_MIN_TASKS);
  assert.ok(group.tasks.length <= plan.workers);
  assert.equal(group.phase, phasePlan.phase);
});

test("T003 every task of a phase is in exactly one of a group or the serial list", () => {
  assert.deepEqual(tasksNotPlacedExactlyOnce(phasePlan), []);
  const twice: PhasePlan = { ...phasePlan, serial: [serial, { id: "T101", reason: "scope" }] };
  assert.deepEqual(tasksNotPlacedExactlyOnce(twice), ["T101"]);
  const missing: PhasePlan = { ...phasePlan, serial: [] };
  assert.deepEqual(tasksNotPlacedExactlyOnce(missing), ["T103"]);
});

/* ------------------------------------------------------------------ *
 * The group at run time.
 * ------------------------------------------------------------------ */

test("T003 a group at run time carries its workers and the seven fingerprints of F142-FR-063", () => {
  assert.equal(GROUP_FINGERPRINT_STAGES.length, 7);
  assert.deepEqual([...GROUP_FINGERPRINT_LETTERS], ["a", "b", "c", "d", "e", "f", "g"]);
  const workers: readonly Worker[] = [
    { workerId: "w1", task: "T101", scope: { prefixes: ["src/a"], source: "task-text" } },
    { workerId: "w2", task: "T102", scope: { prefixes: ["src/b"], source: "consumer" } },
  ];
  const ran: Group = {
    ordinal: group.ordinal,
    phase: group.phase,
    workers,
    fingerprints: Object.fromEntries(
      GROUP_FINGERPRINT_STAGES.map((stage, i) => [stage, `${i}`.repeat(8)]),
    ),
    failed: false,
  };
  assert.equal(ran.workers.length, 2);
  for (const stage of GROUP_FINGERPRINT_STAGES) {
    assert.equal(typeof ran.fingerprints[stage], "string", stage);
  }
  assert.equal(ran.failed, false);
  const kept: KeptUnitOfWork = {
    unitId: "a".repeat(64),
    tasks: [...group.tasks].sort(),
    treeHash: "b".repeat(64),
  };
  assert.deepEqual(kept.tasks, ["T101", "T102"]);
});

/* ------------------------------------------------------------------ *
 * The verdict of the audits.
 * ------------------------------------------------------------------ */

test("T003 a delta carries its paths with the kinds of the tree-store operation `changed`", () => {
  const delta: Delta = {
    workerId: "w1",
    treeId: "tree-7",
    paths: [
      { path: "src/a/one.ts", kind: "added" },
      { path: "src/a/two.ts", kind: "changed" },
      { path: "src/a/three.ts", kind: "deleted" },
      { path: "src/a/four.sh", kind: "mode changed" },
    ],
  };
  for (const p of delta.paths) {
    assert.ok((CHANGE_KINDS as readonly string[]).includes(p.kind), p.kind);
  }
  assert.equal(SINGLE_WRITER_FILES.length, 5);
  assert.deepEqual([...AUDITS], ["scope", "protected", "path-leak"]);
});

test("T003 the verdict of the audits is `accepted` or exactly one reason of row 63", () => {
  const accepted: AuditVerdict = "accepted";
  assert.equal(isAccepted(accepted), true);
  assert.equal(refusalOf(accepted), undefined);
  for (const reason of DELTA_REFUSAL_REASONS) {
    const refused: AuditVerdict = { refused: reason };
    assert.equal(isAccepted(refused), false, reason);
    assert.equal(refusalOf(refused), reason);
    assert.equal(isDeltaRefusalReason(refusalOf(refused) ?? ""), true);
  }
});

test("T003 the verdicts leave the layer in the shape the directive `integrateGroup` carries", () => {
  const verdicts: readonly WorkerVerdict[] = [
    { workerId: "w1", verdict: "accepted" },
    { workerId: "w2", verdict: { refused: "path-leak" } },
  ];
  const request: IntegrateGroupRequest = integrateGroupRequestOf(verdicts);
  assert.deepEqual(
    request.perWorker.map((w) => w.workerId),
    ["w1", "w2"],
  );
  assert.equal(request.perWorker[0]?.outcome, "accepted");
  assert.deepEqual(request.perWorker[1]?.outcome, { refused: "path-leak" });
  assert.ok((DIRECTIVES as readonly string[]).includes("integrateGroup"));
  assert.equal(Object.isFrozen(request), true);
  assert.equal(Object.isFrozen(request.perWorker), true);
});
