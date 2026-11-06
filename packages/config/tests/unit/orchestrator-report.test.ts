/**
 * T043 — the report this feature sends the orchestrator: the keys and rows that
 * other features and annex X §X.7 need (spec "Assumptions").
 *
 * The report is `specs/110-config-and-terms/orchestrator-report.md`, written by
 * `packages/config/tools/orchestrator-report-gen.ts`. This test never reads the
 * generator's return value: it reads the FILE from disk, recomputes what the
 * report should hold from the catalogue and the shipped contract data, and
 * compares. A report that was deleted, truncated or edited by hand fails here.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { describe, it } from "node:test";

import { EXCLUDED_KEYS } from "../../tools/config-keys-gen.ts";
import {
  GAPS,
  REQUESTS,
  check as checkReport,
  corrections,
  defaultPlaces,
  keysByOwner,
  readCatalogue,
  render,
  rowsAnnexNeeds,
} from "../../tools/orchestrator-report-gen.ts";

const PLACES = defaultPlaces();
/** The bytes on disk, read once, through `node:fs` and not through the tool. */
const ON_DISK = readFileSync(PLACES.reportPath, "utf8");
const ROWS = readCatalogue(PLACES);

describe("T043 — the report exists on disk and is the generated report", () => {
  it("the file is there and is not empty", () => {
    const stat = statSync(PLACES.reportPath);
    assert.ok(stat.isFile(), "`orchestrator-report.md` is a file");
    assert.ok(stat.size > 10_000, `${stat.size} bytes`);
    assert.match(ON_DISK, /^# What feature 110 sends the orchestrator$/m);
  });

  it("`--check` of the generator finds no difference between the file and the data", () => {
    assert.deepEqual(checkReport(PLACES), []);
  });

  it("the bytes on disk hash to the same value as a fresh render", () => {
    const sha = (text: string): string => createHash("sha256").update(text).digest("hex");
    assert.equal(sha(ON_DISK), sha(render(PLACES)));
    // The hash is the durable identity the evidence of this phase records.
    assert.match(sha(ON_DISK), /^[0-9a-f]{64}$/);
  });

  it("it carries the five sections the task asks for", () => {
    for (const heading of [
      "## Part A.1 — the four things the spec says feature 100 lacked",
      "## Part A.2 — the rows annex X §X.7 still needs",
      "## Part A.3 — the keys this catalogue spells for every other feature",
      "## Part A.4 — the spellings other features must correct in their own specifications",
      "## Part B — the requests of phases 1 to 5",
    ]) {
      assert.ok(ON_DISK.includes(heading), `the section ${heading} is missing`);
    }
  });
});

describe("T043 — the report names every key and row the data says is needed", () => {
  it('every one of the four gaps of the spec\'s "Assumptions" has a row with its state', () => {
    assert.equal(GAPS.length, 4);
    for (const gap of GAPS) {
      const row = ON_DISK.split("\n").find((line) => line.startsWith(`| ${gap.id} |`));
      assert.ok(row, `${gap.id} has no row`);
      assert.match(row, /\*\*supplied\*\*|\*\*still needed\*\*/);
      const state = gap.check(PLACES);
      assert.ok(
        row.includes(state.supplied ? "**supplied**" : "**still needed**"),
        `${gap.id}: the row disagrees with the files`,
      );
      assert.ok(row.includes(state.evidence.split(",")[0]), `${gap.id}: the row cites no evidence`);
    }
  });

  it("every switch with no row of annex X §X.7 is named, and nothing else is", () => {
    const needed = rowsAnnexNeeds(ROWS);
    assert.deepEqual(
      needed.map((row) => row.key),
      ["toolchains.<id>", "harnesses.prime.tools"],
      "the set of switches without a row changed; the report follows the data",
    );
    const section = ON_DISK.slice(ON_DISK.indexOf("## Part A.2"), ON_DISK.indexOf("## Part A.3"));
    for (const row of needed) {
      assert.ok(section.includes(`\`${row.key}\``), `${row.key} is not asked for`);
      assert.ok(section.includes(`| ${row.owner} |`), `${row.key}: the owner is not named`);
    }
    // A key that HAS a row is not asked for a second time.
    assert.equal(section.includes("`loop.strategy`"), false);
  });

  it("every owner feature of the catalogue has a row with its exact key count", () => {
    const owners = keysByOwner(ROWS);
    assert.ok(owners.length >= 39, `${owners.length} owner features`);
    const section = ON_DISK.slice(ON_DISK.indexOf("## Part A.3"), ON_DISK.indexOf("## Part A.4"));
    for (const entry of owners) {
      const row = section.split("\n").find((line) => line.startsWith(`| ${entry.feature} | `));
      assert.ok(row, `feature ${entry.feature} has no row`);
      assert.ok(
        row.startsWith(`| ${entry.feature} | ${entry.keys.length} |`),
        `feature ${entry.feature}: the row does not state ${entry.keys.length} keys`,
      );
      for (const key of entry.keys) {
        assert.ok(row.includes(`\`${key}\``), `feature ${entry.feature}: \`${key}\` is missing`);
      }
    }
    // The four keys of feature 107 that the catalogue excludes are named with
    // their reason, so a reader cannot take the tables and the file as equal.
    for (const key of EXCLUDED_KEYS) {
      assert.ok(section.includes(`\`${key}\``), `the excluded key \`${key}\` is not named`);
    }
  });

  it("every corrected spelling is named with its old spelling and its owner", () => {
    const corrected = corrections(ROWS);
    assert.ok(corrected.length >= 36, `${corrected.length} corrections`);
    const section = ON_DISK.slice(ON_DISK.indexOf("## Part A.4"), ON_DISK.indexOf("## Part B"));
    for (const row of corrected) {
      const line = section.split("\n").find((text) => text.startsWith(`| \`${row.key}\` |`));
      assert.ok(line, `the correction of \`${row.key}\` is missing`);
      for (const old of row.old.split(";")) {
        assert.ok(
          line.includes(`\`${old.trim()}\``),
          `\`${row.key}\`: the old spelling is missing`,
        );
      }
      assert.ok(line.includes(`| ${row.owner} |`), `\`${row.key}\`: the owner is not named`);
    }
  });

  it("the requests of phases 1 to 5 each have an id of their own, an ask and a citation", () => {
    assert.ok(REQUESTS.length >= 13, `${REQUESTS.length} requests`);
    assert.equal(new Set(REQUESTS.map((request) => request.id)).size, REQUESTS.length);
    const section = ON_DISK.slice(ON_DISK.indexOf("## Part B"));
    for (const request of REQUESTS) {
      const line = section.split("\n").find((text) => text.startsWith(`| ${request.id} |`));
      assert.ok(line, `${request.id} has no row`);
      assert.ok(line.includes(request.citation), `${request.id}: the citation is missing`);
      assert.ok(request.ask.length > 80, `${request.id}: the ask is too short to act on`);
      assert.match(request.raisedIn, /phase/);
    }
    // The report asks and never repairs: no request says it changed another
    // feature's file.
    for (const request of REQUESTS) {
      assert.doesNotMatch(request.ask, /\brepaired here\b/);
    }
  });
});
