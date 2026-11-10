/**
 * CT-152-12 — the corrective block is bounded, byte-stable and renders an
 * unreadable hit as `line unknown` (F152-FR-012, F152-FR-010, F152-FR-013).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { feedbackOfTheCommitGate } from "../src/gate/feedback.ts";
import { writeBlockRecord, readBlockRecord } from "../src/post-approval/commit-gate.ts";
import { loadEngineCommitGateRules } from "@specstride/kernel/redactor/commit-gate-rules";

const HERE = dirname(fileURLToPath(import.meta.url));
const RULES = loadEngineCommitGateRules();

function reasonOf(rule: string): string {
  return RULES.rules.find((entry) => entry.rule === rule)?.reason ?? "a reason";
}

function render(
  hits: readonly { rule: string; file: string; line: number }[],
  ordinal = 1,
  nonce = "0123456789abcdef",
): string {
  return feedbackOfTheCommitGate({
    phase: 1,
    ordinal,
    nonce,
    rejectCount: 1,
    rejectLimit: 3,
    hits: hits.map((hit) => ({ ...hit, file: `"${hit.file}"`, reason: reasonOf(hit.rule) })),
    hitsOmitted: 0,
  });
}

test("at most 20 hits (F152-FR-012)", () => {
  const hits = Array.from({ length: 25 }, (_, i) => ({
    rule: "cg-bearer",
    file: `file${String(i)}.ts`,
    line: i + 1,
  }));
  const text = render(hits);
  const lines = text.split("\n").filter((line) => line.startsWith("- rule "));
  assert.equal(lines.length, 20);
  assert.ok(text.includes("- and 5 more hits"), text);
});

test("at most 4 KiB (F152-FR-012)", () => {
  const hits = Array.from({ length: 20 }, (_, i) => ({
    rule: "cg-bearer",
    file: `"${"d".repeat(160)}"`,
    line: i + 1,
  }));
  const text = render(hits);
  assert.ok(Buffer.byteLength(text, "utf8") <= 4096, String(Buffer.byteLength(text, "utf8")));
});

test("byte-stable (F152-FR-012)", () => {
  const hits = [
    { rule: "cg-bearer", file: "b.ts", line: 2 },
    { rule: "cg-bearer", file: "a.ts", line: 3 },
  ];
  const once = render(hits, 2, "0123456789abcdef");
  const twice = render(hits, 2, "0123456789abcdef");
  const reordered = render([...hits].reverse(), 2, "0123456789abcdef");
  assert.equal(once, twice);
  assert.equal(once, reordered);
  // One signature, other line numbers: other bytes (the lines are shown).
  const otherLines = render(
    hits.map((hit) => ({ ...hit, line: hit.line + 10 })),
    2,
    "0123456789abcdef",
  );
  assert.notEqual(once, otherLines);
  // Another nonce: other bytes (the notice and the fence carry it).
  assert.notEqual(once, render(hits, 2, "fedcba9876543210"));
});

test("an unreadable hit renders `line unknown` and its record validates (T173)", async () => {
  const text = render([{ rule: "cg-unreadable", file: "a.ts", line: 0 }]);
  assert.ok(text.includes('file "a.ts" line unknown'), text);
  assert.ok(!text.includes("line 0"), text);
  // The same rendering with the shipped golden template shape.
  const golden = readFileSync(join(HERE, "fixtures/152/corrective-one-hit.md"), "utf8");
  assert.ok(golden.includes('file "src/a.ts" line 3'));

  // A block record holding an unreadable hit validates against the schema.
  const root = tmpdir();
  const fsMod = await import("node:fs");
  const { mkdtempSync, rmSync } = fsMod;
  const dir = mkdtempSync(join(root, "ct-152-12-"));
  try {
    const logical = await writeBlockRecord(
      {
        schema: "specstride.commit-gate-block/1",
        feature: "152-commit-backpressure",
        phase: 2,
        ordinal: 1,
        runId: "run-1",
        engineStartId: "e1",
        verdictId: "v-1",
        hits: [{ rule: "cg-unreadable", file: "a.ts", line: 0 }],
        hitsOmitted: 0,
        signature: "a".repeat(64),
        ruleDataHash: "b".repeat(64),
        nonce: "a1b2c3d4e5f60718",
        at: "2026-11-09T00:00:00Z",
        path: "pre-scan",
      },
      {
        atomicWrite: (file, bytes) => {
          const { writeFileSync, mkdirSync } = fsMod;
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, bytes, "utf8");
        },
        inControl: (path) => join(dir, path),
      },
    );
    assert.equal(logical, "commit-gate/phase2.1.block.json");
    const record = await readBlockRecord(2, 1, {
      readControl: (path) => readFileSync(join(dir, path), "utf8"),
    });
    assert.ok(record !== null);
    assert.deepEqual(record.hits, [{ rule: "cg-unreadable", file: "a.ts", line: 0 }]);
    assert.equal(record.nonce, "a1b2c3d4e5f60718");
    assert.equal(record.path, "pre-scan");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
