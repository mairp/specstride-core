/**
 * T005 — the two data files of `packages/policy/data/`, copied from
 * `specs/127-quota-budgets-and-pause/contracts/` and VALIDATED AT LOAD against
 * the table schema of feature 100 (F127-FR-003).
 *
 * The copy itself is proven by reading both files and comparing them byte for
 * byte, so a drift between the contract and the data the product ships fails
 * here rather than at a sink.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { TableLoadError, TABLE_SCHEMA_ID } from "@specstride/kernel";
import { CLASSES, CONFIDENCES } from "@specstride/contracts/ep/quota-classifier";
import {
  ClassifierDataError,
  CLASSIFY_POINT,
  DATA_FILES,
  DATA_SOURCES,
  DEFAULT_CLASSIFIER_TABLE,
  DEFAULT_TEXT_PATTERNS,
  loadClassifierTable,
  loadTextPatterns,
  PATTERNS_SCHEMA_ID,
  RETRYABLE_BY_CLASS,
} from "../src/quota/table.ts";

const REPO = fileURLToPath(new URL("../../../", import.meta.url));
const read = (path: string): string => readFileSync(`${REPO}${path}`, "utf8");

test("T005: both data files are byte-for-byte copies of the contract files", () => {
  assert.equal(read(DATA_FILES.table), read(DATA_SOURCES.table), DATA_FILES.table);
  assert.equal(read(DATA_FILES.patterns), read(DATA_SOURCES.patterns), DATA_FILES.patterns);
});

test("T005: the table validates at load against the table schema of feature 100", () => {
  const loaded = loadClassifierTable();
  assert.equal(loaded.table.schema, TABLE_SCHEMA_ID, "the schema id of annex X §X.3");
  assert.equal(loaded.table.id, "quota-classifier-default");
  assert.equal(loaded.version, "1", "versioned data (F127-FR-003)");
  assert.ok(CLASSIFY_POINT in loaded.table.rows);
  // Every choice of the point is a class of EP-12 (F127-FR-001).
  for (const choice of loaded.table.points[CLASSIFY_POINT].choices) {
    assert.ok((CLASSES as readonly string[]).includes(choice), `the choice ${choice}`);
  }
});

test("T005: every row carries a confidence of row 47 and the `retryable` of its class", () => {
  for (const [ruleId, facts] of DEFAULT_CLASSIFIER_TABLE.facts) {
    assert.ok((CONFIDENCES as readonly string[]).includes(facts.confidence), ruleId);
    assert.equal(
      facts.retryable,
      RETRYABLE_BY_CLASS[facts.quotaClass],
      `${ruleId}: §Q.1 gives one \`retryable\` per class (item W-127-02)`,
    );
  }
});

test("T005: the table has exactly one default row, and it is Q-99 -> provider_other", () => {
  const defaults = [...DEFAULT_CLASSIFIER_TABLE.facts.entries()].filter(([, f]) => f.isDefault);
  assert.equal(defaults.length, 1, "one default row (F100-FR-204)");
  assert.equal(defaults[0][0], "Q-99");
  assert.equal(DEFAULT_CLASSIFIER_TABLE.defaultRuleId, "Q-99");
  assert.equal(defaults[0][1].quotaClass, "provider_other", "F127-FR-001");
  assert.equal(defaults[0][1].confidence, "text", "F127-FR-001");
});

test("T005: the load refuses a table whose predicate names no operator", () => {
  // The notation the contract file carried before T005 normalized it.
  const shorthand = {
    schema: TABLE_SCHEMA_ID,
    id: "t",
    version: "1",
    points: { classify: { signals: { httpStatus: "number" }, choices: ["auth"] } },
    rows: {
      classify: [
        {
          ruleId: "a",
          when: { equal: ["httpStatus", 401] },
          choice: "auth",
          retryable: false,
          confidence: "status",
        },
        { ruleId: "d", choice: "auth", retryable: false, confidence: "status" },
      ],
    },
  };
  assert.throws(
    () => loadClassifierTable(shorthand),
    (error: unknown) =>
      error instanceof TableLoadError && /unknown operator/.test((error as Error).message),
  );
});

test("T005: the load refuses a row whose `retryable` is not the constant of its class", () => {
  const wrong = {
    schema: TABLE_SCHEMA_ID,
    id: "t",
    version: "1",
    points: { classify: { signals: { httpStatus: "number" }, choices: ["auth"] } },
    rows: {
      classify: [
        {
          ruleId: "a",
          when: { op: "equal", signal: "httpStatus", value: 401 },
          choice: "auth",
          retryable: true, // §Q.1 says false for `auth`
          confidence: "status",
        },
        { ruleId: "d", choice: "auth", retryable: false, confidence: "status" },
      ],
    },
  };
  assert.throws(
    () => loadClassifierTable(wrong),
    (error: unknown) =>
      error instanceof ClassifierDataError && /item W-127-02/.test((error as Error).message),
  );
});

test("T005: the load refuses a row whose confidence is outside the closed set of row 47", () => {
  const wrong = {
    schema: TABLE_SCHEMA_ID,
    id: "t",
    version: "1",
    points: { classify: { signals: { httpStatus: "number" }, choices: ["auth"] } },
    rows: {
      classify: [{ ruleId: "d", choice: "auth", retryable: false, confidence: "guessed" }],
    },
  };
  assert.throws(
    () => loadClassifierTable(wrong),
    (error: unknown) =>
      error instanceof ClassifierDataError && /row 47/.test((error as Error).message),
  );
});

test("T005: the pattern set validates at load", () => {
  const patterns = loadTextPatterns();
  assert.deepEqual(
    [...patterns.order],
    ["credit", "auth", "window", "context", "overload"],
    "the order of evaluation the data file gives",
  );
  for (const group of patterns.order) {
    const list = patterns.groups.get(group);
    assert.ok(list !== undefined && list.length > 0, group);
  }
  assert.equal(DEFAULT_TEXT_PATTERNS.order.length, patterns.order.length);
});

test("T005: the load refuses a pattern set with a wrong schema id, or a group not in `order`", () => {
  assert.throws(
    () => loadTextPatterns({ schema: "other/1", groups: { a: ["x"] }, order: ["a"] }),
    (error: unknown) =>
      error instanceof ClassifierDataError && (error as Error).message.includes(PATTERNS_SCHEMA_ID),
  );
  assert.throws(
    () =>
      loadTextPatterns({
        schema: PATTERNS_SCHEMA_ID,
        groups: { a: ["x"], b: ["y"] },
        order: ["a"],
      }),
    (error: unknown) =>
      error instanceof ClassifierDataError && /not named in `order`/.test((error as Error).message),
  );
  assert.throws(
    () => loadTextPatterns({ schema: PATTERNS_SCHEMA_ID, groups: { a: [] }, order: ["a"] }),
    (error: unknown) =>
      error instanceof ClassifierDataError && /holds no pattern/.test((error as Error).message),
  );
});
