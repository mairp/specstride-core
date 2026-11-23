// Feature 153, phase 14 (US4) — the per-task evidence is a pure function of
// the tree and the model window only (F153-SC-010, Principle IX). Its input
// type has no field for anything a checkpoint carries — a checkpoint note, a
// handoff, a feedback text, a check output or an attempt number — and the
// module imports nothing from the carry modules. The same tree gives the
// same evidence however the inputs are ordered.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  perTaskEvidenceOf,
  type PerTaskEvidenceInput,
} from "../../../packages/core/src/critic-input/evidence/per-task.ts";

/** A deterministic pseudo-random bit stream from an integer seed. */
function seededBits(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x1_0000_0000;
  };
}

function shuffle<T>(items: readonly T[], next: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

test("only the tree and the model", () => {
  // The input type has no field for anything a checkpoint carries. Each
  // excess property must be a type error (checked at typecheck time by the
  // `@ts-expect-error`s; at runtime the excess keys must not change the
  // render either).
  const base: PerTaskEvidenceInput = {
    tasks: [{ id: "T001", paths: ["src/a.ts"] }],
    changedPaths: ["src/a.ts"],
    contentOf: (path) => (path === "src/a.ts" ? "export const a = 1;\n" : undefined),
    windowTokens: undefined,
    totalBudgetBytes: 1_000_000,
  };
  const clean = perTaskEvidenceOf(base).text;

  const tainted: Record<string, unknown> = { ...base };
  tainted["checkpointNote"] = "note";
  tainted["handoff"] = "handoff";
  tainted["feedbackText"] = "feedback";
  tainted["checkOutput"] = "check";
  tainted["attemptNumber"] = 7;
  assert.equal(perTaskEvidenceOf(tainted as unknown as PerTaskEvidenceInput).text, clean);

  // Type level: each carried field is refused on the input type.
  const refuses = (build: () => PerTaskEvidenceInput): boolean => build === build;
  void refuses;
  {
    // @ts-expect-error - a checkpoint note is not an input of the evidence
    const bad: PerTaskEvidenceInput = { ...base, checkpointNote: "note" };
    void bad;
  }
  {
    // @ts-expect-error - a handoff is not an input of the evidence
    const bad: PerTaskEvidenceInput = { ...base, handoff: "handoff" };
    void bad;
  }
  {
    // @ts-expect-error - a feedback text is not an input of the evidence
    const bad: PerTaskEvidenceInput = { ...base, feedbackText: "feedback" };
    void bad;
  }
  {
    // @ts-expect-error - a check output is not an input of the evidence
    const bad: PerTaskEvidenceInput = { ...base, checkOutput: "check" };
    void bad;
  }
  {
    // @ts-expect-error - an attempt number is not an input of the evidence
    const bad: PerTaskEvidenceInput = { ...base, attemptNumber: 7 };
    void bad;
  }

  // The module imports nothing from the carry modules.
  const source = readFileSync(
    join(import.meta.dirname, "../../../packages/core/src/critic-input/evidence/per-task.ts"),
    "utf8",
  );
  assert.ok(!/from\s+".*\/carry\//.test(source), "per-task.ts imports nothing from carry/");
});

test("the same tree gives the same evidence", () => {
  const paths = ["src/a.ts", "src/b.ts", "test/b.test.ts", "docs/x.md", "src/c.ts"];
  const contents: Record<string, string> = {};
  for (const [i, path] of paths.entries()) contents[path] = `// ${path}\nline ${i}\n`;

  const render = (
    tasks: readonly { id: string; paths: readonly string[] }[],
    order: {
      changed: readonly string[];
      keys: readonly string[];
    },
  ) =>
    perTaskEvidenceOf({
      tasks,
      changedPaths: order.changed,
      contentOf: (path) => {
        for (const key of order.keys) if (key === path) return contents[key];
        return undefined;
      },
      windowTokens: undefined,
      totalBudgetBytes: 1_000_000,
    });

  const tasks = [
    { id: "T001", paths: ["src/a.ts"] },
    { id: "T002", paths: ["src/b.ts", "test/b.test.ts"] },
    { id: "T003", paths: ["src/c.ts"] },
  ];
  const next = seededBits(0x5eed_153);
  for (let i = 0; i < 100; i += 1) {
    const order = {
      changed: shuffle(paths, next),
      keys: shuffle(paths, next),
    };
    const result = render(tasks, order);
    const reference = render(tasks, { changed: paths, keys: paths });
    assert.equal(result.text, reference.text, `run ${i}: the text is order-independent`);
    assert.deepEqual(result.shown, reference.shown, `run ${i}: shown is order-independent`);
    assert.deepEqual(
      result.notShown,
      reference.notShown,
      `run ${i}: notShown is order-independent`,
    );
  }
});
