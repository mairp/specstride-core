/**
 * Feature 153, phase 14 (US4) — per-task critic evidence (F153-FR-051,
 * Principle IX). One section per task, in task order, each holding its
 * files' text; the per-file cap is the F117-FR-011 grounding budget scaled
 * by `scaledCap` from the window of the critic model actually used, never
 * below `MIN_SCALED_BUDGET_BYTES`; the rendered text never exceeds the
 * total budget given.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  excerptOf,
  fileCapOf,
  perTaskEvidenceOf,
} from "../../../packages/core/src/critic-input/evidence/per-task.ts";
import {
  BUDGETS,
  GROUNDING_HEAD_BYTES,
  GROUNDING_TAIL_BYTES,
} from "../../../packages/core/src/critic-input/grounding/grounding.ts";
import {
  MIN_SCALED_BUDGET_BYTES,
  scaledCap,
} from "../../../packages/core/src/critic-input/prompt/fit.ts";

/** A content map over a small fixed tree. */
function contentsOf(entries: Record<string, string>) {
  return (path: string) => entries[path];
}

test("each task shows its files", () => {
  const contents = {
    "src/a.ts": "export const a = 1;\n",
    "src/b.ts": "export const b = 2;\n",
    "test/b.test.ts": 'import { b } from "../src/b.ts";\n',
  };
  const result = perTaskEvidenceOf({
    tasks: [
      { id: "T001", paths: ["src/a.ts"] },
      { id: "T002", paths: ["src/b.ts", "test/b.test.ts"] },
    ],
    changedPaths: ["src/a.ts", "src/b.ts", "test/b.test.ts"],
    contentOf: contentsOf(contents),
    windowTokens: undefined,
    totalBudgetBytes: 1_000_000,
  });

  // One section per task, in task order.
  const first = result.text.indexOf("T001");
  const second = result.text.indexOf("T002");
  assert.ok(first !== -1, "T001 has a section");
  assert.ok(second !== -1, "T002 has a section");
  assert.ok(first < second, "the sections follow task order");

  // Each section holds its files' text.
  assert.ok(result.text.includes(contents["src/a.ts"]!), "T001 shows src/a.ts");
  assert.ok(result.text.includes(contents["src/b.ts"]!), "T002 shows src/b.ts");
  assert.ok(result.text.includes(contents["test/b.test.ts"]!), "T002 shows test/b.test.ts");

  // Every shown path is recorded.
  assert.deepEqual([...result.shown].sort(), ["src/a.ts", "src/b.ts", "test/b.test.ts"]);
  assert.deepEqual(result.notShown, []);
});

test("the budget is the window's", () => {
  // The reference window gives the unscaled grounding budget as the cap.
  assert.equal(
    fileCapOf(BUDGETS.referenceWindowTokens),
    scaledCap(BUDGETS.groundingBudgetBytes, BUDGETS.referenceWindowTokens),
  );
  assert.equal(fileCapOf(BUDGETS.referenceWindowTokens), BUDGETS.groundingBudgetBytes);

  // Half the window halves the cap, never below the floor.
  const half = Math.floor(BUDGETS.referenceWindowTokens / 2);
  assert.equal(fileCapOf(half), scaledCap(BUDGETS.groundingBudgetBytes, half));
  assert.ok(fileCapOf(half) >= MIN_SCALED_BUDGET_BYTES);

  // A window an eighth as large hits the floor, not zero.
  const eighth = Math.floor(BUDGETS.referenceWindowTokens / 8);
  assert.equal(fileCapOf(eighth), MIN_SCALED_BUDGET_BYTES);

  // The rendered text never exceeds the total budget given.
  const bigFile = "x".repeat(20_000);
  const result = perTaskEvidenceOf({
    tasks: [{ id: "T001", paths: ["src/big.ts"] }],
    changedPaths: ["src/big.ts"],
    contentOf: contentsOf({ "src/big.ts": bigFile }),
    windowTokens: BUDGETS.referenceWindowTokens,
    totalBudgetBytes: 8_000,
  });
  assert.ok(
    Buffer.byteLength(result.text, "utf8") <= 8_000,
    `the text (${Buffer.byteLength(result.text, "utf8")} bytes) exceeds the total budget`,
  );
  // The file never appears whole, and the budget leaves it out by name.
  assert.ok(!result.text.includes(bigFile), "a file over the budget is never shown whole");
  assert.deepEqual(result.notShown, ["src/big.ts"]);
  assert.deepEqual(result.shown, []);
  assert.ok(GROUNDING_HEAD_BYTES > 0 && GROUNDING_TAIL_BYTES > 0);
});

test("a long file keeps its head and tail", () => {
  // A file above the head-tail threshold is shown as head + left-out note + tail.
  // The cap leaves room beside the grounding head (4,000) for the tail (1,000).
  const left = "L".repeat(4_000);
  const right = "R".repeat(1_000);
  const middle = "m".repeat(20_000);
  const long = `${left}${middle}${right}`;
  assert.ok(long.length > 5_000, "the fixture is above the head-tail threshold");

  const excerpt = excerptOf(long, 6_000);
  assert.ok(excerpt.includes(left), "the head is kept");
  assert.ok(excerpt.includes(right), "the tail is kept");
  assert.ok(!excerpt.includes(middle), "the middle is left out");
  const leftOut = /… (\d+) bytes left out …/.exec(excerpt);
  assert.ok(leftOut, "a line says how many bytes were left out");
  assert.ok(Number(leftOut![1]) > 0, "the left-out count is positive");

  // A file at or under the cap is never cut.
  const small = "s".repeat(3_000);
  assert.equal(excerptOf(small, 4_000), small);

  // The same behaviour holds inside the rendered evidence: the scaled cap has
  // a floor of MIN_SCALED_BUDGET_BYTES, so the fixture exceeds that floor.
  const rLeft = "L".repeat(4_000);
  const rMiddle = "m".repeat(85_000);
  const rRight = "R".repeat(1_000);
  const longFile = `${rLeft}${rMiddle}${rRight}`;
  assert.ok(longFile.length > 65_536, "the fixture exceeds the scaled cap");
  const result = perTaskEvidenceOf({
    tasks: [{ id: "T001", paths: ["src/long.ts"] }],
    changedPaths: ["src/long.ts"],
    contentOf: contentsOf({ "src/long.ts": longFile }),
    windowTokens: 40_000,
    totalBudgetBytes: 1_000_000,
  });
  assert.ok(result.text.includes(rLeft), "the rendered evidence keeps the head");
  assert.ok(result.text.includes(rRight), "the rendered evidence keeps the tail");
  assert.ok(!result.text.includes(rMiddle), "the rendered evidence leaves out the middle");
  assert.deepEqual(result.shown, ["src/long.ts"]);
});

test("the budget bounds the text over many seeded inputs", () => {
  const next = seededBits(0xb0b_153);
  const paths = [
    "src/a.ts",
    "src/b.ts",
    "src/c.ts",
    "test/a.test.ts",
    "docs/x.md",
    "src/long.ts",
  ];
  const contents: Record<string, string> = {};
  for (const [i, path] of paths.entries()) {
    contents[path] = i === 5 ? "x".repeat(500) : `// ${path}\ncontent line ${i}\n`;
  }

  for (let i = 0; i < 200; i += 1) {
    const budget = 50 + Math.floor(next() * 451); // 50 to 500 bytes
    const named = paths.filter(() => next() < 0.6);
    const changed = paths.filter(() => next() < 0.6);
    if (named.length === 0 && changed.length === 0) continue;
    const result = perTaskEvidenceOf({
      tasks: named.map((path, j) => ({ id: `T${String(j + 1).padStart(3, "0")}`, paths: [path] })),
      changedPaths: changed,
      contentOf: (path) => (next() < 0.2 ? undefined : contents[path]),
      windowTokens: undefined,
      totalBudgetBytes: budget,
    });

    // The bound holds on every input, however small the budget.
    assert.ok(
      Buffer.byteLength(result.text, "utf8") <= budget,
      `run ${i}: the text (${Buffer.byteLength(result.text, "utf8")} bytes) exceeds the ${budget}-byte budget`,
    );
    // F153-SC-012: every changed or named path is shown or named, exactly once.
    const every = new Set([...named, ...changed]);
    const accounted = new Set(result.shown);
    for (const path of result.notShown) {
      assert.ok(!accounted.has(path), `run ${i}: ${path} is both shown and not shown`);
      accounted.add(path);
    }
    assert.deepEqual(
      [...accounted].sort(),
      [...every].sort(),
      `run ${i}: shown + notShown covers every changed and named path exactly once`,
    );
    // `shown` and the rendered text agree by construction: every path the
    // result calls shown really appears in the text, as its own heading.
    for (const path of result.shown) {
      assert.ok(
        result.text.includes(`### ${path}`),
        `run ${i}: ${path} is reported shown but its heading is not in the text`,
      );
    }
    // Every left-out path is named in the text: listed under `NOT-SHOWN`,
    // or covered by the count line. The count line is short, so it fits
    // every budget of this property (50 bytes and up); the text is never
    // empty while a path is left out.
    if (result.notShown.length > 0) {
      assert.ok(result.text !== "", `run ${i}: paths are left out but the text is empty`);
      const after = result.text.slice(result.text.indexOf("NOT-SHOWN"));
      const listed = result.notShown.filter((path) => after.includes(path));
      const counted =
        listed.length === 0 &&
        new RegExp(`\\(${result.notShown.length} path(s)? left out\\)`).test(after);
      assert.ok(
        listed.length === result.notShown.length || counted,
        `run ${i}: ${result.notShown.length - listed.length} left-out paths are named nowhere`,
      );
    }
  }
});

test("a section landing exactly on the boundary is shown whole or left out by name", () => {
  const contents = {
    "src/a.ts": "export const a = 1;\nexport const a2 = 2;\n",
    "src/b.ts": "export const b = 3;\nexport const b2 = 4;\n",
  };
  const input = {
    tasks: [{ id: "T001", paths: ["src/a.ts", "src/b.ts"] }],
    changedPaths: ["src/a.ts", "src/b.ts"],
    contentOf: contentsOf(contents),
    windowTokens: undefined,
  };

  // The whole two-file section, measured on a run with room to spare.
  const whole = perTaskEvidenceOf({ ...input, totalBudgetBytes: 1_000_000 });
  const sectionBytes = Buffer.byteLength(whole.text, "utf8");

  // The same budget as the real section: it is admitted in full.
  const exact = perTaskEvidenceOf({ ...input, totalBudgetBytes: sectionBytes });
  assert.deepEqual([...exact.shown].sort(), ["src/a.ts", "src/b.ts"]);
  assert.deepEqual(exact.notShown, []);
  assert.equal(Buffer.byteLength(exact.text, "utf8"), sectionBytes);
  assert.ok(exact.text.includes("### src/a.ts") && exact.text.includes("### src/b.ts"));

  // One byte less: the last file of the section cannot fit. It is named
  // under `NOT-SHOWN`, never shown without its text, and the first file
  // keeps its place.
  const minus1 = perTaskEvidenceOf({ ...input, totalBudgetBytes: sectionBytes - 1 });
  assert.deepEqual(minus1.shown, ["src/a.ts"]);
  assert.deepEqual(minus1.notShown, ["src/b.ts"]);
  assert.ok(minus1.text.includes("### src/a.ts"), "the first file keeps its place");
  assert.ok(!minus1.text.includes("### src/b.ts"), "the second file is not shown");
  assert.ok(minus1.text.includes("src/b.ts"), "the second file is named NOT-SHOWN");
  assert.ok(
    Buffer.byteLength(minus1.text, "utf8") <= sectionBytes - 1,
    `the text (${Buffer.byteLength(minus1.text, "utf8")} bytes) exceeds the budget`,
  );
});

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
