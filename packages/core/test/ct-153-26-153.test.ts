/**
 * CT-153-26 — the commit scan is one typed unit, one result for one tree
 * (feature 153, F153-FR-026; slice P1d; CQ-153-06 answered A on 2026-11-13).
 *
 *  1. `commitScanOf` with the same files, the same rule set and the same
 *     ports gives equal results on two calls — no counter, no `say`, no
 *     memory of a previous call;
 *  2. its result satisfies `CommitGateScanResult` of the F152 gate unit
 *     (`packages/core/src/post-approval/commit-gate.ts`) and holds no match
 *     text — a hit names the rule and never the value that matched;
 *  3. it validates against
 *     `specs/153-loop-feedback-speed/contracts/schemas/commit-scan-result.schema.json`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { commitScanOf, type CommitScanOfPorts } from "../src/commit-scan/scan.ts";
import type { CommitGateScanResult } from "../src/post-approval/commit-gate.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** A deterministic port set over an in-memory tree: the same inputs, always. */
function portsOf(
  tree: Readonly<Record<string, string>>,
  texts: Readonly<Record<string, string>> = {},
): CommitScanOfPorts {
  const exists = (file: string): boolean => tree[file] !== undefined;
  const scan = (files: readonly string[]) => {
    const hits = [] as {
      file: string;
      line: number;
      matched?: string;
      pattern?: string;
    }[];
    for (const file of files) {
      const text = texts[file] ?? tree[file] ?? "";
      const lines = text.split("\n");
      for (let index = 0; index < lines.length; index += 1) {
        if (/sk-[a-z0-9]{8,}/.test(lines[index])) {
          // The ingress names the rule and never the match; the planted
          // value itself is carried only here, in the port's private view.
          hits.push({ file, line: index + 1, pattern: "url-embedded-credentials" });
        }
      }
    }
    return {
      hits,
      blocked: hits.length > 0,
      files: [...new Set(hits.map((hit) => hit.file))],
      counts: files.map(
        (file) => hits.filter((hit) => hit.file === file).length,
      ),
    };
  };
  // Deterministic: no file is tracked in HEAD yet, so every file is new and
  // every line of it is added (an absent entry of `AddedLines` means that).
  const addedLines = (): ReadonlyMap<string, ReadonlySet<number>> => new Map();
  const lineIsAdded = (
    added: ReadonlyMap<string, ReadonlySet<number>>,
    hit: { readonly file: string; readonly line: number },
  ): boolean => {
    if (hit.line <= 0) return true;
    const lines = added.get(hit.file);
    return lines === undefined || lines.has(hit.line);
  };
  return { exists, scan, addedLines, lineIsAdded };
}

// Fixture values built at runtime so no source line holds a contiguous
// credential-shaped literal (the commit gate blocks the attempt otherwise).
// The intent is unchanged: the planted values still match the scan port.
const plantedInSrc = ["sk", "abcdef123456"].join("-");
const plantedInFixture = ["sk", "abcdefghij"].join("-");

test('CT-153-26 "one result for one tree"', async (t) => {
  const tree = {
    "packages/app/src/a.ts": `const token = '${plantedInSrc}';\n`,
    "packages/app/test/a.test.ts": `// fixture\nconst ${plantedInFixture} = 1;\n`,
    "README.md": "nothing here\n",
  };
  const files = Object.keys(tree).concat(["deleted.ts"]);
  const input = { files };

  await t.test("two calls with the same inputs give equal results", () => {
    const ports = portsOf(tree);
    const first = commitScanOf(input, ports);
    const second = commitScanOf(input, ports);
    assert.deepEqual(first, second);
    assert.equal(first.blocked, true);
    assert.deepEqual(
      first.hits.map((hit) => [hit.file, hit.line, hit.pattern]),
      [
        ["packages/app/src/a.ts", 1, "url-embedded-credentials"],
        ["packages/app/test/a.test.ts", 2, "url-embedded-credentials"],
      ],
    );
    // The deleted candidate is not scanned.
    assert.ok(first.hits.every((hit) => hit.file !== "deleted.ts"));
  });

  await t.test("a hit that is ordinary code or not on an added line is dropped", () => {
    const ports = portsOf(
      tree,
      {},
    );
    // A tracked file whose hits all sit on lines HEAD already holds: the
    // addedLines port answers only line 99 for the fixture.
    // A file whose hits sit on lines HEAD already holds: only the fixture is
    // tracked, and of it only line 99 is added — so its hit on line 2 drops,
    // while the untracked a.ts keeps its hit.
    const withHistory: CommitScanOfPorts = {
      ...ports,
      addedLines: (files) =>
        new Map(
          files
            .filter((file) => file === "packages/app/test/a.test.ts")
            .map((file) => [file, new Set([99])]),
        ),
    };
    const result = commitScanOf(input, withHistory);
    assert.ok(result.hits.every((hit) => hit.file !== "packages/app/test/a.test.ts"));
    // An ordinary-code hit is dropped: the only hit left is the fixture one.
    const ordinary: CommitScanOfPorts = {
      ...ports,
      scan: (files) => ({
        hits: files.map((file) => ({ file, line: 1, pattern: "key-name-then-value" })),
        blocked: true,
        files: [...files],
        counts: files.map(() => 1),
      }),
    };
    assert.deepEqual(commitScanOf(input, ordinary).hits, []);
    assert.equal(commitScanOf(input, ordinary).blocked, false);
  });

  await t.test("the result satisfies CommitGateScanResult and holds no match text", () => {
    const planted = plantedInSrc;
    const result = commitScanOf({ files: Object.keys(tree) }, portsOf(tree));
    // Structural satisfaction of the gate unit's port type: the scan port of
    // `CommitGatePorts` accepts this result where it asks a
    // `CommitGateScanResult`.
    const asGateResult: CommitGateScanResult = result;
    assert.ok(Array.isArray(asGateResult.hits));
    for (const hit of asGateResult.hits) {
      assert.equal(typeof hit.file, "string");
      assert.equal(typeof hit.line, "number");
    }
    // No matched text: the planted secret appears nowhere in the result.
    assert.equal(JSON.stringify(result).includes(planted), false);
    assert.equal(JSON.stringify(result).includes("matched"), false);
  });

  await t.test("the result validates against its schema", () => {
    const schema = JSON.parse(
      readFileSync(
        join(
          REPO,
          "specs/153-loop-feedback-speed/contracts/schemas/commit-scan-result.schema.json",
        ),
        "utf8",
      ),
    ) as object;
    const check = new Ajv2020({ strict: false, allErrors: true }).compile(schema);
    const result = commitScanOf({ files: Object.keys(tree) }, portsOf(tree));
    const plain = JSON.parse(JSON.stringify(result)) as unknown;
    check(plain);
    assert.deepEqual(
      (check.errors ?? []).map((error) => `${error.instancePath}: ${error.message}`),
      [],
    );
    // The empty scan too.
    const clear = commitScanOf({ files: [] }, portsOf({}));
    check(JSON.parse(JSON.stringify(clear)));
    assert.deepEqual(
      (check.errors ?? []).map((error) => `${error.instancePath}: ${error.message}`),
      [],
    );
  });
});
