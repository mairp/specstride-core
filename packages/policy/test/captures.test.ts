/**
 * T001 — the capture list of `captures.md`, checked against the data it
 * describes.
 *
 * T001 asks for two things: a confirmation of which captured limit signals
 * exist for the five Wave 1 harnesses, and a list of every classifier row that
 * stays `unverified` until a capture exists. Both are recorded in
 * `packages/policy/test/captures.md`.
 *
 * Prose can rot. This test holds the record to the three sources it claims to
 * summarize, so that the list cannot quietly drift:
 *
 *  - `contracts/classifier.table.json`: every `ruleId` of the table is named in
 *    the record, exactly once, and the counts the record states are the counts
 *    the table has;
 *  - `contracts/text-patterns.json`: every pattern group is attributed;
 *  - the five adapter packages: the claim "no capture exists" is checked by
 *    looking, not asserted.
 *
 * It reads no clock and makes no call.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const CONTRACTS = join(REPOSITORY_ROOT, "specs", "127-quota-budgets-and-pause", "contracts");

const CAPTURES_MD = join(PACKAGE_ROOT, "test", "captures.md");

/**
 * Whether a directory holds a LANDED capture: a captured artifact (a
 * `stream*.jsonl` stream or an `exit-code*.txt` record) or a `capture.json`
 * that says the capture was made. The scaffolding of a capture that was not
 * made (`status: "unverified"`, `result: "not made"`, procedure, README) is
 * NOT a capture: it does not contradict the claim this test checks.
 */
function hasLandedCapture(base: string): boolean {
  if (!existsSync(base) || !statSync(base).isDirectory()) return false;
  for (const name of readdirSync(base)) {
    const path = join(base, name);
    const stats = statSync(path);
    if (stats.isFile() && (/^stream.*\.jsonl$/.test(name) || /^exit-code.*\.txt$/.test(name)))
      return true;
    if (stats.isDirectory()) {
      if (hasLandedCapture(path)) return true;
      const meta = join(path, "capture.json");
      if (existsSync(meta)) {
        try {
          const parsed = JSON.parse(readFileSync(meta, "utf8")) as {
            made?: unknown;
            result?: unknown;
          };
          if (parsed.made === true || parsed.result === "made") return true;
        } catch {
          // A malformed record is not proof of a capture.
        }
      }
    }
  }
  return false;
}

/** The record T001 produces. */
const record = readFileSync(CAPTURES_MD, "utf8");

/** The default classifier table (F127-FR-003). */
const table = JSON.parse(readFileSync(join(CONTRACTS, "classifier.table.json"), "utf8")) as {
  rows: { classify: { ruleId: string; choice: string; confidence: string; default?: boolean }[] };
};
const rows = table.rows.classify;

/** The pattern set of the default text classifier. */
const patterns = JSON.parse(readFileSync(join(CONTRACTS, "text-patterns.json"), "utf8")) as {
  note: string;
  groups: Record<string, string[]>;
};

/**
 * The rows that need no capture, because what they decide is a rule this
 * product makes up rather than a fact about a provider. `captures.md` states
 * the same four and says why for each.
 */
const PRODUCT_RULE_ROWS = ["Q-01-agent_failure", "Q-01-provider_other", "Q-11", "Q-99"] as const;

/** The five Wave 1 harnesses, their adapter feature, and the capture that would record a limit signal. */
const HARNESSES = [
  { harness: "Claude CLI stream", feature: "125", capture: "Capture C" },
  { harness: "dsh", feature: "130", capture: "Capture 5" },
  { harness: "Codex", feature: "131", capture: "Capture 1" },
  { harness: "pi", feature: "134", capture: "Capture 2" },
  { harness: "prime", feature: "138", capture: "Capture 2" },
] as const;

/** The adapter packages that would hold a capture, if one existed. */
const ADAPTER_PACKAGES = [
  "adapter-claude",
  "adapter-dsh",
  "adapter-codex",
  "adapter-pi",
  "adapter-prime",
] as const;

test("T001: the record exists and is the file the task names", () => {
  assert.ok(existsSync(CAPTURES_MD), "packages/policy/test/captures.md exists");
  assert.ok(record.length > 2_000, "the record is more than a stub");
});

test("T001: every classifier row of the table is named in the record, exactly once", () => {
  assert.equal(rows.length, 19, "the table has the 19 rows the record counts");

  // A row id is a prefix of no other, except `Q-01` which prefixes the eight
  // identity rows; so count the ids as they appear inside a table cell.
  for (const row of rows) {
    const occurrences = record.split("`" + row.ruleId + "`").length - 1;
    assert.ok(
      occurrences >= 1,
      `captures.md names the row ${row.ruleId}; it does not. Every row must have a status.`,
    );
  }

  // The row table of the record has one line per row: `| \`<ruleId>\` |`.
  const listed = [...record.matchAll(/^\| `(Q-[\w-]+)` \|/gm)].map((m) => m[1]);
  assert.equal(
    listed.length,
    rows.length,
    "the record's row table has one line per row of the table",
  );
  assert.deepEqual(
    [...listed].sort(),
    rows.map((r) => r.ruleId).sort(),
    "the record's row table is exactly the rows of the classifier table",
  );
  assert.equal(new Set(listed).size, listed.length, "no row is listed twice");
});

test("T001: the counts the record states are the counts the table has", () => {
  const productRules = new Set<string>(PRODUCT_RULE_ROWS);
  const unverified = rows.filter((r) => !productRules.has(r.ruleId));

  assert.equal(unverified.length, 15, "15 rows rest on a provider fact");
  assert.equal(productRules.size, 4, "4 rows are product rules");
  assert.equal(unverified.length + productRules.size, rows.length);

  assert.match(record, /\*\*15 stay `unverified`\*\*/, "the record states the figure 15");
  assert.match(record, /\*\*4 are product rules\*\*/, "the record states the figure 4");
  assert.match(record, /\*\*Count\*\*: 19 rows\./, "the record states the figure 19");

  // Each of the four product-rule rows is marked so and not as unverified.
  for (const ruleId of PRODUCT_RULE_ROWS) {
    const line = record.split("\n").find((l) => l.startsWith("| `" + ruleId + "` |"));
    assert.ok(line, `the record has a row line for ${ruleId}`);
    assert.match(line, /product rule/, `${ruleId} is marked a product rule`);
    assert.doesNotMatch(line, /\*\*unverified\*\*/, `${ruleId} is not marked unverified`);
  }

  // And each of the other fifteen is marked unverified with a capture named.
  for (const row of rows.filter((r) => !productRules.has(r.ruleId))) {
    const line = record.split("\n").find((l) => l.startsWith("| `" + row.ruleId + "` |"));
    assert.ok(line, `the record has a row line for ${row.ruleId}`);
    assert.match(line, /\*\*unverified\*\*/, `${row.ruleId} is marked unverified`);
    assert.match(
      line,
      /\b(125|130|131|134|138)\b/,
      `${row.ruleId} names the adapter feature whose capture closes it`,
    );
  }
});

test("T001: the five harnesses and their captures are each confirmed as absent", () => {
  for (const { harness, feature, capture } of HARNESSES) {
    assert.ok(record.includes(harness), `the record names the harness ${harness}`);
    assert.ok(
      record.includes("**" + capture + "**") || record.includes(capture),
      `the record names ${capture} for feature ${feature}`,
    );
  }
  // The confirmation itself: the record says no capture exists, and says it as
  // a finding rather than leaving it to be inferred.
  assert.match(
    record,
    /\*\*No captured limit signal exists for any of the five Wave 1 harnesses\.\*\*/,
    "the record states the confirmation of T001 plainly",
  );
  // One `no` per harness row of the table of section 1.
  const absent = [...record.matchAll(/\| \*\*no\*\* \|/g)];
  assert.equal(
    absent.length,
    HARNESSES.length,
    "every one of the five rows records the capture as absent",
  );
});

test("T001: the claim that no capture exists is checked against the adapter packages", () => {
  // The record claims the five adapter packages hold the skeleton only. This
  // looks, so the claim is evidence and not an assertion.
  for (const name of ADAPTER_PACKAGES) {
    const dir = join(REPOSITORY_ROOT, "packages", name);
    assert.ok(existsSync(dir), `packages/${name} exists`);

    const fixtureDirs = ["fixtures", "captures", "data"].filter((sub) =>
      hasLandedCapture(join(dir, sub)),
    );
    assert.deepEqual(
      fixtureDirs,
      [],
      `packages/${name} holds no capture tree; captures.md records the capture as absent. ` +
        `If a capture has landed, captures.md must be updated.`,
    );
  }
});

test("T001: every pattern group of the text classifier is attributed in the record", () => {
  // The pattern file says of itself that every entry is unverified; the record
  // must not claim otherwise.
  assert.match(patterns.note, /unverified/, "text-patterns.json marks itself unverified");

  const groups = Object.keys(patterns.groups);
  assert.deepEqual(groups.sort(), ["auth", "context", "credit", "overload", "window"]);

  for (const group of groups) {
    const line = record.split("\n").find((l) => l.startsWith("| `" + group + "` |"));
    assert.ok(line, `the record attributes the pattern group ${group}`);
    assert.match(line, /\b(Q-0[6-9]|Q-10)\b/, `the pattern group ${group} names the row it feeds`);
    assert.match(
      line,
      /\b(125|130|131|134|138)\b/,
      `the pattern group ${group} names the capture that closes it`,
    );
  }
});

test("T001: the record names a capture only as unverified, and claims no verified provider fact", () => {
  // The out-of-band policy: a paid, live, person-run step is recorded as
  // unverified with a reason and never run or faked. The record must say so.
  assert.match(record, /paid, live, person-run/, "the record states the kind of step a capture is");
  assert.match(
    record,
    /runs none of them, fakes no result/,
    "the record states that nothing was run or faked",
  );
  // And it must not claim a verified-on date for any capture.
  assert.doesNotMatch(
    record,
    /verified-on:\s*20\d\d-\d\d-\d\d/,
    "no capture carries a verified-on date, because none was made",
  );
});
