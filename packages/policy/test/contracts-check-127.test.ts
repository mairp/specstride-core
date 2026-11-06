/**
 * T084 — the CHECK OF THE FOUR FILES OF `contracts/` AGAINST THE SPEC.
 *
 * `specs/127-quota-budgets-and-pause/contracts/README.md`: "The specification
 * stands where a file and the spec differ. … `tasks.md` has a task that checks
 * the four files against the spec." This is that task, and it is a TEST and
 * not a reading: the spec is PARSED here — the table of §Q.1, the table of
 * §Q.2, the table of the section "Closed sets" and the sentence of
 * F127-FR-031 — and every claim of the four files is asserted against what the
 * parse produced. A change on either side fails the suite.
 *
 * The report of the check is `./contracts-check-127.md`.
 *
 * | File | Checked against |
 * |---|---|
 * | `classifier.table.json` | §Q.1 (the classes, the action, `retryable`) and §Q.2 (the confidences, the order of evidence) |
 * | `text-patterns.json` | §Q.1 and §Q.2 (the groups the table names, the order, "unverified") |
 * | `closed-sets.json` | the section "Closed sets" (the seven rows, their members, their unknown value) |
 * | `spend-ledger.schema.json` | F127-FR-031 (the fields the ledger must hold), and a LEDGER THE IMPLEMENTATION BUILT is validated against it |
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONFIDENCES_THAT_PAUSE_AFTER_A_PROBE,
  CONFIDENCES_THAT_PAUSE_AT_ONCE,
} from "../src/quota/probe.ts";
import { QUOTA_CLASSES, RESET_SOURCES } from "../src/quota/classify.ts";
import { ACTION_BY_CLASS } from "../src/quota/actions.ts";
import { BUDGET_DIMENSIONS } from "../src/budget/ceilings.ts";
import {
  BILLING_MODES,
  LEDGER_LOGICAL_NAME,
  LEDGER_SCHEMA_ID,
  applyUsageRecord,
  emptyLedger,
  type SpendLedger,
} from "../src/budget/ledger.ts";
import { ALERT_KINDS, ALERT_LEVELS } from "../src/budget/alerts.ts";
import { SKIP_REASONS } from "../src/budget/fallback.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const FEATURE = join(ROOT, "specs", "127-quota-budgets-and-pause");
const CONTRACTS = join(FEATURE, "contracts");
const DATA = join(ROOT, "packages", "policy", "data");

const SPEC = readFileSync(join(FEATURE, "spec.md"), "utf8");

const table = JSON.parse(readFileSync(join(CONTRACTS, "classifier.table.json"), "utf8")) as {
  readonly schema: string;
  readonly points: Record<
    string,
    { readonly signals: Record<string, string>; readonly choices: readonly string[] }
  >;
  readonly rows: Record<
    string,
    readonly {
      readonly ruleId: string;
      readonly when?: { readonly op: string; readonly signal: string; readonly value: unknown };
      readonly default?: boolean;
      readonly choice: string;
      readonly retryable: boolean;
      readonly confidence: string;
    }[]
  >;
};
const patterns = JSON.parse(readFileSync(join(CONTRACTS, "text-patterns.json"), "utf8")) as {
  readonly schema: string;
  readonly note: string;
  readonly groups: Record<string, readonly string[]>;
  readonly order: readonly string[];
};
const closedSets = JSON.parse(readFileSync(join(CONTRACTS, "closed-sets.json"), "utf8")) as {
  readonly schema: string;
  readonly owner: string;
  readonly sets: readonly {
    readonly row: number;
    readonly name: string;
    readonly members: readonly string[];
    readonly unknown: string;
  }[];
};
const ledgerSchema = JSON.parse(
  readFileSync(join(CONTRACTS, "spend-ledger.schema.json"), "utf8"),
) as JsonSchema;

/* ------------------------------------------------------------------ *
 * Reading the spec: the sections and their tables.
 * ------------------------------------------------------------------ */

/** The body of one heading of `spec.md`, up to the next heading of any depth. */
function sectionOf(heading: string): string {
  const start = SPEC.indexOf(heading);
  assert.notEqual(start, -1, `\`spec.md\` has no heading \`${heading}\``);
  const after = SPEC.slice(start + heading.length);
  const end = after.search(/\n#{2,4} /);
  return end === -1 ? after : after.slice(0, end);
}

/** The rows of the first markdown table of a section, as trimmed cells. */
function tableOf(section: string): readonly (readonly string[])[] {
  const rows: string[][] = [];
  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (rows.length > 0) break;
      continue;
    }
    if (/^\|[\s|:-]+\|$/.test(trimmed)) continue;
    rows.push(
      trimmed
        .slice(1, trimmed.endsWith("|") ? -1 : undefined)
        .split("|")
        .map((cell) => cell.trim()),
    );
  }
  assert.ok(rows.length > 1, "the section has a table with a header and rows");
  return rows.slice(1);
}

/** Every `backticked` token of a cell, in order. */
function ticked(cell: string): readonly string[] {
  return [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1] as string);
}

/** The bullet of one requirement, up to its first sub-item. */
function requirementOf(id: string): string {
  const start = SPEC.indexOf(`- **${id}**`);
  assert.notEqual(start, -1, `\`spec.md\` has no ${id}`);
  const after = SPEC.slice(start);
  const end = after.indexOf("\n  - ");
  return end === -1 ? after.slice(0, 2000) : after.slice(0, end);
}

/** Words of four letters or more, lowercased: how two prose cells are compared. */
function words(text: string): ReadonlySet<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/`/g, "")
      .split(/[^a-z_]+/)
      .filter((word) => word.length >= 4),
  );
}

/* ------------------------------------------------------------------ *
 * §Q.1 — the classes, the action on each, `retryable`.
 * ------------------------------------------------------------------ */

const Q1 = tableOf(sectionOf("### §Q.1 Classes and the action on each"));
const Q1_CLASSES = Q1.map((row) => ticked(row[0] as string)[0] as string);
/** class → the value of the column `retryable` of §Q.1. */
const Q1_RETRYABLE = new Map(
  Q1.map((row) => [ticked(row[0] as string)[0] as string, (row[5] as string).trim()]),
);

test("T084/§Q.1: the spec names nine classes, and they are the nine of the closed set and of the code", () => {
  assert.equal(Q1.length, 9, "§Q.1 has nine rows");
  assert.deepEqual([...Q1_CLASSES], [...QUOTA_CLASSES], "the nine of §Q.1, in order");
  const row46 = closedSets.sets.find((set) => set.row === 46);
  assert.ok(row46, "`closed-sets.json` has row 46");
  assert.deepEqual([...row46.members], [...Q1_CLASSES], "row 46 holds exactly the nine of §Q.1");
});

test("T084/classifier.table.json: the choices are the eight classes a classifier can produce", () => {
  const classify = table.points.classify;
  assert.ok(classify, "the file declares the point `classify`");
  // `budget_cap` is the one class of §Q.1 that NO provider failure produces: its
  // row says "a cap of this feature was reached … the budget path of §Q.3", so
  // it is written by `../src/budget/`, never chosen by the classifier.
  const budgetCapRow = Q1.find((row) => ticked(row[0] as string)[0] === "budget_cap");
  assert.ok(budgetCapRow, "§Q.1 has the row `budget_cap`");
  assert.match(budgetCapRow[2] as string, /budget path/, "its action is the budget path of §Q.3");
  assert.deepEqual(
    [...classify.choices],
    Q1_CLASSES.filter((name) => name !== "budget_cap"),
    "the choices are §Q.1's classes less `budget_cap`, in §Q.1's order",
  );
});

test("T084/classifier.table.json: every row carries the constant `retryable` of its class in §Q.1", () => {
  const rows = table.rows.classify;
  assert.ok(rows && rows.length > 0, "the file has rows for `classify`");
  for (const row of rows) {
    const spec = Q1_RETRYABLE.get(row.choice);
    assert.ok(spec !== undefined, `${row.ruleId}: the choice \`${row.choice}\` is a class of §Q.1`);
    assert.equal(
      String(row.retryable),
      spec,
      `${row.ruleId} chooses \`${row.choice}\`, whose \`retryable\` in §Q.1 is ${spec}`,
    );
    // And the code's own table of §Q.1 agrees with the file.
    assert.equal(
      row.retryable,
      ACTION_BY_CLASS[row.choice as keyof typeof ACTION_BY_CLASS].retryable,
    );
  }
});

test("T084/classifier.table.json: every class a classifier can produce has at least one row", () => {
  const produced = new Set(table.rows.classify.map((row) => row.choice));
  for (const name of table.points.classify.choices) {
    assert.ok(produced.has(name), `no row of the table can produce \`${name}\``);
  }
});

test("T084/classifier.table.json: the default row chooses the unknown value of closed set 46", () => {
  const rows = table.rows.classify;
  const defaults = rows.filter((row) => row.default === true);
  assert.equal(defaults.length, 1, "exactly one default row");
  assert.equal(defaults[0], rows[rows.length - 1], "and it is the last row");
  const row46 = closedSets.sets.find((set) => set.row === 46);
  assert.equal(defaults[0]?.choice, row46?.unknown, "the default is the unknown value of row 46");
  // §Q.1 says so in words, in the meaning of `provider_other`.
  const providerOther = Q1.find((row) => ticked(row[0] as string)[0] === "provider_other");
  assert.match(
    providerOther?.[1] as string,
    /matches nothing/,
    "§Q.1: the class of an input that matches nothing",
  );
});

/* ------------------------------------------------------------------ *
 * §Q.2 — the confidences, the order of evidence, the probe, the reset.
 * ------------------------------------------------------------------ */

const Q2 = tableOf(sectionOf("### §Q.2 Confidence, sources of a reset time, and the probe"));

/** The content cell of one subject of §Q.2. */
function q2(subject: string): string {
  const row = Q2.find((cells) => (cells[0] as string).startsWith(subject));
  assert.ok(row, `§Q.2 has no row \`${subject}\``);
  return row[1] as string;
}

test("T084/classifier.table.json: the confidences of the rows are confidences of §Q.2", () => {
  const five = ticked(q2("Confidence")).slice(0, 5);
  assert.deepEqual([...five], ["structured", "status", "text", "stall", "host"]);
  for (const row of table.rows.classify) {
    assert.ok(five.includes(row.confidence), `${row.ruleId}: \`${row.confidence}\` is of §Q.2`);
  }
  // `host` is "a fact that a host observed" and never a row of the table: it
  // comes through `../src/quota/host.ts`, as §Q.2's own wording says.
  assert.match(q2("Confidence"), /`host` is a fact that a host observed/);
  assert.ok(
    !table.rows.classify.some((row) => row.confidence === "host"),
    "no row of the table claims the confidence `host`",
  );
});

test("T084/classifier.table.json: the rows follow §Q.2's order of evidence", () => {
  const order = ["structured", "status", "text", "stall"];
  assert.match(
    q2("Confidence"),
    /Order of evidence: a structured signal of the stream, then an HTTP status or code, then a text pattern[^.]*, then the stall watchdog/,
  );
  let highest = -1;
  for (const row of table.rows.classify) {
    if (row.default === true) continue;
    const rank = order.indexOf(row.confidence);
    assert.ok(rank >= 0, `${row.ruleId}: a ranked confidence`);
    assert.ok(rank >= highest, `${row.ruleId}: \`${row.confidence}\` comes after a weaker row`);
    highest = rank;
  }
});

test("T084/§Q.2: the two confidences that pause at once and the three that need a probe are the code's", () => {
  assert.deepEqual(ticked(q2("Pauses at once")), [...CONFIDENCES_THAT_PAUSE_AT_ONCE]);
  assert.deepEqual(ticked(q2("Pauses only after a confirming probe")), [
    ...CONFIDENCES_THAT_PAUSE_AFTER_A_PROBE,
  ]);
});

test("T084/closed-sets.json: the sources of a reset time of §Q.2 are row 207", () => {
  const sources = ticked(q2("Sources of `resetsAt`"));
  assert.deepEqual([...sources], [...RESET_SOURCES]);
  const row207 = closedSets.sets.find((set) => set.row === 207);
  assert.deepEqual([...(row207?.members ?? [])], [...sources]);
  assert.match(
    q2("Sources of `resetsAt`"),
    /and null$/,
    "§Q.2 also allows null, which is not a member",
  );
});

/* ------------------------------------------------------------------ *
 * `text-patterns.json` against §Q.1 and §Q.2.
 * ------------------------------------------------------------------ */

test("T084/text-patterns.json: its groups are exactly the groups the table's rows name", () => {
  const named = table.rows.classify
    .filter((row) => row.when?.signal === "textGroup")
    .map((row) => row.when?.value as string);
  assert.deepEqual([...named].sort(), Object.keys(patterns.groups).sort());
  assert.deepEqual(
    [...patterns.order].sort(),
    Object.keys(patterns.groups).sort(),
    "`order` is a permutation of the groups",
  );
  for (const group of patterns.order) {
    assert.ok((patterns.groups[group] ?? []).length > 0, `the group \`${group}\` has patterns`);
  }
});

test("T084/text-patterns.json: every group leads to a class of §Q.1, and the file says it is unverified", () => {
  for (const group of Object.keys(patterns.groups)) {
    const row = table.rows.classify.find(
      (entry) => entry.when?.signal === "textGroup" && entry.when?.value === group,
    );
    assert.ok(row, `the group \`${group}\` is read by a row`);
    assert.ok(
      Q1_CLASSES.includes(row.choice),
      `\`${group}\` leads to \`${row.choice}\`, a class of §Q.1`,
    );
    assert.equal(row.confidence, "text", "a pattern group gives the confidence `text`");
  }
  assert.match(patterns.note, /unverified/, "the pattern set marks itself unverified");
});

/* ------------------------------------------------------------------ *
 * `closed-sets.json` against the section "Closed sets".
 * ------------------------------------------------------------------ */

const CLOSED = tableOf(sectionOf("## Closed sets"));

test("T084/closed-sets.json: the seven rows of the spec are the seven of the file", () => {
  const rowsOfTheSpec = CLOSED.map((cells) =>
    Number(/\(row (\d+)\)/.exec(cells[0] as string)?.[1]),
  );
  assert.deepEqual(rowsOfTheSpec, [46, 47, 48, 205, 206, 207, 208]);
  assert.deepEqual(
    closedSets.sets.map((set) => set.row),
    rowsOfTheSpec,
    "the file has the same seven rows, in the same order",
  );
  assert.equal(closedSets.owner, "127", "owner of each: 127");
});

test("T084/closed-sets.json: every row's members and unknown value are the spec's", () => {
  for (const cells of CLOSED) {
    const row = Number(/\(row (\d+)\)/.exec(cells[0] as string)?.[1]);
    const set = closedSets.sets.find((candidate) => candidate.row === row);
    assert.ok(set, `the file has row ${row}`);
    // The name, without the "(row NN)" the spec adds.
    assert.equal(set.name, (cells[0] as string).replace(/\s*\(row \d+\)\s*$/, ""));
    assert.deepEqual([...set.members], ticked(cells[1] as string), `row ${row}: the members`);
    assert.equal((cells[2] as string).trim(), "Design", `row ${row}: closed by design`);
    // The unknown value: a member where the spec gives one, else prose that
    // says the same thing in the same words.
    const specUnknown = cells[3] as string;
    const asAMember = ticked(specUnknown);
    if (
      asAMember.length === 1 &&
      set.members.includes(asAMember[0] as string) &&
      words(specUnknown).size <= 2
    ) {
      assert.equal(set.unknown, asAMember[0], `row ${row}: the unknown value`);
    } else {
      const spec = words(specUnknown);
      for (const word of words(set.unknown)) {
        assert.ok(
          spec.has(word),
          `row ${row}: the file's unknown value says "${word}", which the spec does not`,
        );
      }
    }
  }
});

test("T084/closed-sets.json: the members of the four sets the code owns are the code's", () => {
  const membersOf = (row: number) => closedSets.sets.find((set) => set.row === row)?.members ?? [];
  assert.deepEqual([...membersOf(48)], [...ALERT_LEVELS]);
  assert.deepEqual([...membersOf(205)], [...ALERT_KINDS]);
  assert.deepEqual([...membersOf(206)], [...BUDGET_DIMENSIONS]);
  assert.deepEqual([...membersOf(208)], [...SKIP_REASONS]);
});

/* ------------------------------------------------------------------ *
 * `spend-ledger.schema.json` against F127-FR-031.
 * ------------------------------------------------------------------ */

/** What F127-FR-031 names, and where the schema holds it. */
const FR031_FIELDS: readonly { readonly phrase: string; readonly pointer: readonly string[] }[] = [
  { phrase: "per role and per billing mode", pointer: ["roles", "*", "byBilling"] },
  { phrase: "the tokens", pointer: ["roles", "*", "byBilling", "*", "inputTokens"] },
  { phrase: "the real cost", pointer: ["roles", "*", "byBilling", "*", "realCostUsd"] },
  { phrase: "the notional cost", pointer: ["roles", "*", "byBilling", "*", "notionalCostUsd"] },
  { phrase: "the estimated cost", pointer: ["roles", "*", "byBilling", "*", "estimatedCostUsd"] },
  { phrase: "the number of calls", pointer: ["roles", "*", "byBilling", "*", "calls"] },
  {
    phrase: "the coverage of F127-FR-028",
    pointer: ["roles", "*", "byBilling", "*", "passesWithKnownCost"],
  },
  { phrase: "the number of phase attempts started", pointer: ["run", "phaseAttempts"] },
  { phrase: "the limit-window facts of F127-FR-009", pointer: ["windows", "byTarget"] },
  { phrase: "the start of the pause episode", pointer: ["windows", "episodeStart"] },
];

/** Walk a schema by property name; `*` steps through `additionalProperties`. */
function propertyAt(schema: JsonSchema, pointer: readonly string[]): JsonSchema | undefined {
  let here: JsonSchema | undefined = schema;
  for (const step of pointer) {
    if (here === undefined) return undefined;
    here =
      step === "*"
        ? typeof here.additionalProperties === "object"
          ? here.additionalProperties
          : undefined
        : here.properties?.[step];
  }
  return here;
}

test("T084/spend-ledger.schema.json: it is the schema of the logical name and the schema id of the spec", () => {
  const fr031 = requirementOf("F127-FR-031");
  assert.match(fr031, /The spend ledger MUST hold/);
  assert.equal(ledgerSchema.properties?.schema?.const, LEDGER_SCHEMA_ID);
  assert.equal(ledgerSchema.properties?.schema?.const, "specstride.spend/1");
  assert.ok(
    String(ledgerSchema.title).includes(LEDGER_LOGICAL_NAME),
    "the title names `run:<runId>:spend`",
  );
  assert.deepEqual(
    [
      ...(propertyAt(ledgerSchema, ["roles", "*"])?.properties?.byBilling?.propertyNames?.enum ??
        []),
    ],
    [...BILLING_MODES],
    "the three billing modes of the spec",
  );
});

test("T084/spend-ledger.schema.json: every field F127-FR-031 names is in the schema", () => {
  const fr031 = requirementOf("F127-FR-031");
  for (const field of FR031_FIELDS) {
    assert.ok(fr031.includes(field.phrase), `F127-FR-031 still names "${field.phrase}"`);
    assert.ok(
      propertyAt(ledgerSchema, field.pointer) !== undefined,
      `the schema has ${field.pointer.join("/")} for "${field.phrase}"`,
    );
  }
  // The five token fields of the data model, one by one.
  for (const token of [
    "inputTokens",
    "outputTokens",
    "cacheReadTokens",
    "cacheWriteTokens",
    "reasoningTokens",
  ]) {
    assert.ok(
      propertyAt(ledgerSchema, ["roles", "*", "byBilling", "*", token]) !== undefined,
      token,
    );
  }
  // The limit-window fact, as F127-FR-009 and the data model give it.
  const fact = propertyAt(ledgerSchema, ["windows", "byTarget", "*"]);
  assert.ok(fact, "the schema describes one limit-window fact");
  for (const field of ["quotaClass", "resetsAt", "utilization", "rateLimitType", "observedAt"]) {
    assert.ok(fact.properties?.[field] !== undefined, `the fact has \`${field}\``);
  }
});

test("T084/spend-ledger.schema.json: a ledger the implementation built validates against it", () => {
  let ledger: SpendLedger = emptyLedger("run-t084");
  ledger = applyUsageRecord(ledger, {
    usageId: "u-1",
    role: "proposer",
    billingMode: "api",
    inputTokens: 1_000,
    outputTokens: 200,
    cacheReadTokens: 10,
    cacheWriteTokens: 5,
    reasoningTokens: 0,
    costUsd: 3,
    isCall: true,
    closesAPass: true,
  }).ledger;
  ledger = applyUsageRecord(ledger, {
    usageId: "u-2",
    role: "critic",
    billingMode: "subscription",
    inputTokens: 50,
    costUsd: 0.5,
    isCall: true,
    closesAPass: true,
  }).ledger;
  ledger = applyUsageRecord(ledger, {
    usageId: "u-3",
    role: "proposer",
    billingMode: "weird-mode",
    costUsd: null,
    isCall: true,
  }).ledger;
  ledger.windows.byTarget["stub-harness/base"] = {
    quotaClass: "quota_window",
    resetsAt: "2026-01-01T05:00:00.000Z",
    utilization: 1,
    rateLimitType: "tokens-per-window",
    observedAt: "2026-01-01T00:00:00.000Z",
  };
  ledger.windows.episodeStart = "2026-01-01T00:00:00.000Z";
  ledger.run.phaseAttempts = 2;
  ledger.alertsFired.push("budget-threshold:proposer:50");
  ledger.partial = false;

  const errors = validateAgainst(ledgerSchema, JSON.parse(JSON.stringify(ledger)), "$");
  assert.deepEqual(errors, [], "the ledger of the implementation satisfies the schema of the spec");
});

/* ------------------------------------------------------------------ *
 * The two copies the code loads are the files that were checked.
 * ------------------------------------------------------------------ */

test("T084: the data files the code loads are byte-for-byte the checked contracts", () => {
  for (const name of ["classifier.table.json", "text-patterns.json"]) {
    assert.equal(
      readFileSync(join(DATA, name), "utf8"),
      readFileSync(join(CONTRACTS, name), "utf8"),
      `packages/policy/data/${name} is the contract file`,
    );
  }
});

/* ------------------------------------------------------------------ *
 * A small validator for the subset of JSON Schema the four files use.
 * ------------------------------------------------------------------ */

type JsonSchema = {
  readonly type?: string | readonly string[];
  readonly const?: unknown;
  readonly required?: readonly string[];
  readonly properties?: Record<string, JsonSchema>;
  readonly additionalProperties?: JsonSchema | boolean;
  readonly propertyNames?: { readonly enum?: readonly string[] };
  readonly items?: JsonSchema;
  readonly minimum?: number;
  readonly title?: string;
  readonly description?: string;
};

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

/** Every way `value` fails `schema`; an empty list means it validates. */
function validateAgainst(schema: JsonSchema, value: unknown, path: string): readonly string[] {
  const errors: string[] = [];
  if (schema.type !== undefined) {
    const allowed = typeof schema.type === "string" ? [schema.type] : [...schema.type];
    const actual = typeOf(value);
    const ok = allowed.includes(actual) || (actual === "integer" && allowed.includes("number"));
    if (!ok) errors.push(`${path}: expected ${allowed.join(" or ")}, saw ${actual}`);
  }
  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path}: expected the constant ${String(schema.const)}`);
  }
  if (typeof schema.minimum === "number" && typeof value === "number" && value < schema.minimum) {
    errors.push(`${path}: below the minimum ${schema.minimum}`);
  }
  if (Array.isArray(value) && schema.items !== undefined) {
    value.forEach((item, index) =>
      errors.push(...validateAgainst(schema.items as JsonSchema, item, `${path}[${index}]`)),
    );
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const name of schema.required ?? []) {
      if (!(name in record)) errors.push(`${path}: the required property \`${name}\` is missing`);
    }
    for (const [name, member] of Object.entries(record)) {
      const allowedNames = schema.propertyNames?.enum;
      if (allowedNames !== undefined && !allowedNames.includes(name)) {
        errors.push(
          `${path}: the property name \`${name}\` is not one of ${allowedNames.join(", ")}`,
        );
      }
      const property = schema.properties?.[name];
      if (property !== undefined) {
        errors.push(...validateAgainst(property, member, `${path}.${name}`));
        continue;
      }
      if (schema.additionalProperties === false) {
        errors.push(`${path}: the property \`${name}\` is not allowed`);
        continue;
      }
      if (typeof schema.additionalProperties === "object") {
        errors.push(...validateAgainst(schema.additionalProperties, member, `${path}.${name}`));
      }
    }
  }
  return errors;
}
