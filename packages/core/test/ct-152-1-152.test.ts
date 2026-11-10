/**
 * CT-152-1 — a blocking hit blocks (F152-FR-001).
 *
 * With the switch on, the commit gate runs over exactly what the approval
 * commit would hold. A hit whose rule says `block` holds the commit back: the
 * gate answers `{blocked: true}` with the hit and the rule that matched it,
 * and never with any text of the match.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { commitGate, signatureOfHits } from "../src/post-approval/commit-gate.ts";
import { loadEngineCommitGateRules } from "@specstride/kernel/redactor/commit-gate-rules";

const RULES = loadEngineCommitGateRules();

function portsOf(
  hits: readonly { file: string; line: number; matched: "pattern"; pattern?: string }[],
) {
  const calls: { files: readonly string[]; overlay: Readonly<Record<string, string>> }[] = [];
  return {
    calls,
    scan: (files: readonly string[], overlay?: Readonly<Record<string, string>>) => {
      calls.push({ files, overlay: overlay ?? {} });
      return { blocked: hits.length > 0, hits };
    },
  };
}

function inputs() {
  return {
    commits: true,
    insideAWorkTree: true,
    changedPaths: ["a.ts"],
    tasksPath: "tasks.md",
    tickedTasksText: "- [x] t1",
    rules: RULES,
  };
}

test("a blocking hit blocks", () => {
  const ports = portsOf([{ file: "a.ts", line: 3, matched: "pattern", pattern: "bearer" }]);
  const result = commitGate(inputs(), ports);
  assert.equal(result.entered, true);
  assert.equal(result.blocked, true);
  if (result.blocked) {
    assert.deepEqual(result.hits, [{ rule: "cg-bearer", file: "a.ts", line: 3 }]);
    assert.equal(typeof result.signature, "string");
    assert.ok(result.signature.length > 0);
  }
  assert.equal(ports.calls.length, 1);
});

test("an exempt hit does not block (F152-FR-019)", () => {
  const ports = portsOf([
    { file: "a.ts", line: 3, matched: "pattern", pattern: "key-name-then-value" },
  ]);
  const result = commitGate(inputs(), ports);
  assert.deepEqual(result, { entered: true, blocked: false });
});

test("no work tree, commits off, or no changes: not entered (F152-FR-001, XVII)", () => {
  const scan = () => {
    throw new Error("the scan port must never be called");
  };
  assert.deepEqual(commitGate({ ...inputs(), commits: "off" }, { scan }), { entered: false });
  assert.deepEqual(commitGate({ ...inputs(), commits: false }, { scan }), { entered: false });
  assert.deepEqual(commitGate({ ...inputs(), insideAWorkTree: false }, { scan }), {
    entered: false,
  });
  assert.deepEqual(commitGate({ ...inputs(), changedPaths: [] }, { scan }), { entered: false });
});

test("the ticked task list is scanned through the overlay (research D8)", () => {
  const ports = portsOf([]);
  commitGate(
    {
      commits: true,
      insideAWorkTree: true,
      changedPaths: ["a.ts", "tasks.md", "b.ts"],
      tasksPath: "tasks.md",
      tickedTasksText: "- [x] t1\n- [x] t2",
      rules: RULES,
    },
    ports,
  );
  assert.equal(ports.calls.length, 1);
  const { files, overlay } = ports.calls[0]!;
  assert.deepEqual([...files].sort(), ["a.ts", "b.ts", "tasks.md"]);
  assert.deepEqual(overlay, { "tasks.md": "- [x] t1\n- [x] t2" });
});

test("the signature depends only on the (rule, file) pairs (E2)", () => {
  const a = signatureOfHits([{ rule: "cg-bearer", file: "a.ts", line: 3 }]);
  const b = signatureOfHits([{ rule: "cg-bearer", file: "a.ts", line: 9 }]);
  const c = signatureOfHits([{ rule: "cg-bearer", file: "a.ts", line: 1 }]);
  const other = signatureOfHits([{ rule: "cg-bearer", file: "b.ts", line: 1 }]);
  assert.equal(a, b);
  assert.equal(a, c);
  assert.notEqual(a, other);
});
