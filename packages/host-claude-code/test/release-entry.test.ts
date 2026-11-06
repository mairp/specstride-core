/**
 * The Host row of the entry of the live run (T205) is this host's to supply.
 * The fixture entry of the testkit's release-table test
 * (`packages/testkit/test/release-workflow.test.ts`, T225 condition 3) names
 * the kit's sample host; this test holds THIS host's row against the same
 * rule of F100-FR-224:
 *
 *  - the entry of the live run carries a Host row, and the row this host
 *    writes names this package at the version of its own manifest;
 *  - an entry that names this host for its build, with every phase gate
 *    approved, gives the rule no refusal;
 *  - an entry that drops the Host row is refused by the name of the field,
 *    which is the fact the fixture pinned.
 *
 * The rule is `@specstride/testkit/release/conditions`, the release-condition
 * rule of the testkit's staged host surface (the split, phase 3): the binding
 * takes it from the package - the workspace link today, the installed tarball
 * when this plugin is its own repository - and holds no path into the
 * repository's tests/.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRY_LABELS, liveRunRefusals } from "@specstride/testkit/release/conditions";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const manifest = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as {
  name: string;
  version: string;
};

/** The Host row this host writes into the entry of its live run. */
const HOST_ROW = `${manifest.name} ${manifest.version}`;

/**
 * The eight-field entry of a live run, as verified.md writes it, with `host`
 * in the Host row; without `host`, the row is not written at all.
 */
function entry(host: string | undefined, build: string, gates: string): string {
  const rows = ["| Date | 2026-10-02 |", `| Build | ${build} |`];
  if (host !== undefined) rows.push(`| Host | ${host} |`);
  return [
    "## T205 — CT-100-324, the live integration run",
    "",
    "### The entry, when the run has been made",
    "",
    "| Field | Value |",
    "|---|---|",
    ...rows,
    "| Harness versions | claude-code 1.2.3 |",
    "| Reference project | the reference project of T205 |",
    `| Result per phase gate | ${gates} |`,
    "| Time per stage, beside the baseline | phase 1: 10s against 12s |",
    "| Oracle on the same build | no result `different` |",
    "",
    "## T206 — the next section",
  ].join("\n");
}

test("the entry of the live run carries a Host row, and this host's row names this package", () => {
  // The rule of condition 3 reads the field by name: an entry without it is
  // refused, so the host cannot publish an entry that drops the row.
  assert.equal(ENTRY_LABELS.includes("Host"), true);
  // The row is this package, at the version of this package's manifest — the
  // value the testkit's fixture used to hard-code.
  assert.equal(manifest.name, "@specstride/host-claude-code");
  assert.match(HOST_ROW, /^@specstride\/host-claude-code \d+\.\d+\.\d+$/);
});

test("an entry that names this host for its build, every gate approved, gives the rule no refusal", () => {
  assert.deepEqual(liveRunRefusals(entry(HOST_ROW, "deadbeef", "1 to 9 approved"), "deadbeef"), []);
});

test("an entry that drops the Host row is refused by the name of the field", () => {
  const refusals = liveRunRefusals(entry(undefined, "deadbeef", "1 to 9 approved"), "deadbeef");
  assert.ok(refusals.some((r) => /no field "Host"/.test(r)));
});
