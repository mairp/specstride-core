/**
 * T057 — THE ADMISSION EVENT CARRIES EVERY CHECK'S VERDICT (F154-FR-024,
 * F142-FR-011, -025): the admission of every task and of every group is the
 * event `parallel.admission` with the verdict of **every** check and its
 * detail, so a reader of the events tells which check refused without
 * re-running the gate. This file pins the two builders of the layer:
 *
 *  - `admissionEvent` (`decide.ts`) — one event per task, keyed by `taskId`,
 *    with a verdict and a detail per check of row 61 that ran;
 *  - `groupAdmissionEvent` (`decide.ts`, new) — one event per group, keyed by
 *    `groupId`, with the ordered verdict list of the group's gate and the
 *    first failed check as the reason;
 *  - `groupGateVerdicts` (`admission.ts`, new) — the verdict of every
 *    group-level check of the gate, whose first failure is the reason
 *    `groupGate` refuses with.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  admissionEvent,
  groupAdmissionEvent,
  groupGate,
  groupGateVerdicts,
  scopesOf,
  type AdmissionInputs,
  type AdmissionVerdict,
} from "../src/index.ts";

/** A clean admission of the phase attempt: every group-level check passes. */
const CLEAN: AdmissionInputs = Object.freeze({
  workers: 2,
  scopes: scopesOf([{ id: "T1", text: "the reader in src/reader/" }]),
  innerCheckSet: Object.freeze(["typecheck", "test"]),
  adoptableJobsAlive: 0,
  containment: "C2" as const,
});

test("the admission event of one task carries the verdict and the detail of every check", () => {
  const checks: readonly AdmissionVerdict[] = Object.freeze([
    { check: "marker", passed: true, detail: "the task carries [P]" },
    { check: "scope", passed: false, detail: "the scope src/writer/ overlaps src/writer/" },
  ]);
  const event = admissionEvent({ id: "T001", checks });
  assert.equal(event.type, "parallel.admission");
  const data = event.data as {
    taskId: string;
    verdicts: Record<string, string>;
    details: Record<string, string>;
  };
  assert.equal(data.taskId, "T001");
  // THE VERDICT OF EVERY CHECK, carried by name.
  assert.deepEqual(data.verdicts, { marker: "passed", scope: "failed" });
  // THE DETAIL OF EVERY CHECK, carried by the same name.
  assert.deepEqual(data.details, {
    marker: "the task carries [P]",
    scope: "the scope src/writer/ overlaps src/writer/",
  });
});

test("the admission events of a group of three tasks are one per task, never shared", () => {
  const checks: readonly AdmissionVerdict[] = Object.freeze([
    { check: "marker", passed: true, detail: "admitted" },
  ]);
  const events = ["T001", "T002", "T003"].map((id) => admissionEvent({ id, checks }));
  assert.equal(events.length, 3);
  assert.deepEqual(
    events.map((event) => (event.data as { taskId: string }).taskId),
    ["T001", "T002", "T003"],
  );
});

test("the admission event of one group carries its verdicts, its reason and its admission", () => {
  const checks: readonly AdmissionVerdict[] = Object.freeze([
    { check: "resource", passed: true, detail: "no exclusive resource" },
    { check: "headroom", passed: false, detail: "cycles: 0 cycle(s) remain and a group of 1 task(s) charges 1" },
  ]);
  const event = groupAdmissionEvent({
    groupId: "g-2-1",
    ordinal: 1,
    phase: 2,
    admitted: false,
    checks,
  });
  assert.equal(event.type, "parallel.admission");
  const data = event.data as {
    groupId: string;
    ordinal: number;
    phase: number;
    admitted: boolean;
    reason?: string;
    verdicts: readonly { check: string; verdict: string; detail: string }[];
  };
  assert.equal(data.groupId, "g-2-1");
  assert.equal(data.ordinal, 1);
  assert.equal(data.phase, 2);
  assert.equal(data.admitted, false);
  // THE REASON is the first failed check.
  assert.equal(data.reason, "headroom");
  // THE VERDICT OF EVERY CHECK, in order, each with its detail.
  assert.deepEqual(data.verdicts, [
    { check: "resource", verdict: "passed", detail: "no exclusive resource" },
    {
      check: "headroom",
      verdict: "failed",
      detail: "cycles: 0 cycle(s) remain and a group of 1 task(s) charges 1",
    },
  ]);
});

test("an admitted group's admission event names no reason and carries only passes", () => {
  const checks: readonly AdmissionVerdict[] = Object.freeze([
    { check: "resource", passed: true, detail: "no exclusive resource" },
    { check: "headroom", passed: true, detail: "the quota windows hold headroom" },
  ]);
  const data = groupAdmissionEvent({
    groupId: "g-2-2",
    ordinal: 2,
    phase: 2,
    admitted: true,
    checks,
  }).data as { admitted: boolean; reason?: string; verdicts: { verdict: string }[] };
  assert.equal(data.admitted, true);
  assert.equal(data.reason, undefined);
  assert.deepEqual(
    data.verdicts.map((verdict) => verdict.verdict),
    ["passed", "passed"],
  );
});

test("groupGateVerdicts carries the verdict of every group-level check, in row 61's order", () => {
  const verdicts = groupGateVerdicts(CLEAN);
  // Six group-level gates: resource, headroom (quota), headroom (cycles),
  // check, links, jobs.
  assert.deepEqual(
    verdicts.map((verdict) => verdict.check),
    ["resource", "headroom", "headroom", "check", "links", "jobs"],
  );
  assert.equal(verdicts.every((verdict) => verdict.passed), true);
  assert.equal(verdicts.every((verdict) => verdict.detail.length > 0), true);
});

test("the first failed verdict of groupGateVerdicts is the reason groupGate refuses with", () => {
  // An empty inner check set: the gate refuses with `check`.
  const inputs: AdmissionInputs = { ...CLEAN, innerCheckSet: Object.freeze([]) };
  const gate = groupGate(inputs);
  const verdicts = groupGateVerdicts(inputs);
  assert.equal(gate.admitted, false);
  assert.equal(gate.reason, "check");
  const firstFailed = verdicts.find((verdict) => !verdict.passed);
  assert.equal(firstFailed?.check, "check");
  assert.equal(firstFailed?.detail, gate.detail);
});

test("a refused cycles verdict stands under headroom and is told apart by its detail", () => {
  const inputs: AdmissionInputs = Object.freeze({
    ...CLEAN,
    cycles: {
      sufficesForTheGroup: {
        admissible: false,
        needed: 1,
        detail: "0 cycle(s) remain and a group of 1 task(s) charges 1",
      },
    },
  });
  const gate = groupGate(inputs);
  assert.equal(gate.admitted, false);
  assert.equal(gate.reason, "headroom");
  assert.match(gate.detail, /^cycles: /);
  const cyclesVerdict = groupGateVerdicts(inputs).find(
    (verdict) => verdict.check === "headroom" && !verdict.passed,
  );
  assert.match(cyclesVerdict?.detail ?? "", /^cycles: /);
});

test("the two headroom verdicts are both carried when both checks pass", () => {
  const verdicts = groupGateVerdicts(CLEAN).filter((verdict) => verdict.check === "headroom");
  assert.equal(verdicts.length, 2);
});
