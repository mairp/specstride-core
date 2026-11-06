/**
 * CT-141-129 — the registry entry of the baseline that the port does not carry
 * (T119, T122; F141-FR-029, §O.7, CQ-029, DV-064).
 *
 * The requirement has four parts and each is a test below:
 *
 * - **no fixture, no stub name, no imported asset.** No `fixture.json` of the
 *   oracle names it, the set of stub names does not hold it, and no file under
 *   `fixtures/assets/` carries it — the import of the recorded streams (T123)
 *   leaves the one stream of that entry behind.
 * - **found at run time.** `notCarriedEntries` reads the registry of the
 *   reference out of the tree at the pinned commit and subtracts the entries with
 *   as-is behaviour the product carries. The arithmetic is asserted on a synthetic
 *   registry, so the test runs without a clone, and again on the real tree where a
 *   clone is present.
 * - **taken out before anything is stored or compared.** N-15 takes it out of the
 *   reference side: a capture that holds the display line of the registry comes
 *   out of the normalizer reading as the list of a side that never held the entry,
 *   and the rule counts the removal.
 * - **a check fails when the name appears in a file of the oracle.** The scan
 *   finds a planted name under a root of its own and the assertion throws; against
 *   the real package — golden captures included — it finds nothing.
 *
 * The test holds no name of the entry either: every assertion is written against
 * what the arithmetic returns.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  NotCarriedEntryError,
  assertNoFileOfTheOracleNamesAnEntry,
  entriesOfTheReferenceRegistry,
  entriesTheProductCarries,
  filesOfTheOracleThatNameAnEntry,
  mentionsOfAnEntry,
  namesAnEntry,
  notCarriedEntries,
  takeOutNotCarried,
  withoutAnEntry,
} from "../../src/normalize/not-carried-entry.ts";
import { N15 } from "../../src/normalize/text.ts";
import { stubExecutableNames } from "../../stubs/lib/names.ts";
import { referenceTreeOf, skipReasonFor } from "../reference-tree.ts";

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const made: string[] = [];
function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `oracle-not-carried-${prefix}-`));
  made.push(dir);
  return dir;
}
process.on("exit", () => {
  for (const dir of made) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // nothing to do
    }
  }
});

/**
 * A registry in the shape `lib/backends.py` has, with the entries the caller
 * names. The reader of the oracle reads `Backend("<name>"` out of that file, so a
 * synthetic registry proves the arithmetic without a clone of the baseline.
 */
function registry(root: string, names: readonly string[]): string {
  const file = join(root, "lib", "backends.py");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    `REGISTRY = (\n${names
      .map((name) => `    Backend("${name}", (("proposer", Qualifier("none")),)),\n`)
      .join("")})\n`,
    "utf8",
  );
  return root;
}

/** The entry the real tree does not carry, where a clone is present. */
function theEntryOfTheRealTree(): string | undefined {
  const tree = referenceTreeOf("specstride");
  if (tree === undefined) return undefined;
  const found = notCarriedEntries({ referenceRoot: tree.root });
  assert.equal(found.length, 1, "the baseline has exactly one entry the product does not carry");
  return found[0] as string;
}

// ---------------------------------------------------------------------------
// Found at run time
// ---------------------------------------------------------------------------

test("CT-141-129: the entry is found at run time, as a subtraction of two registries", () => {
  const carried = entriesTheProductCarries();
  assert.ok(carried.length >= 4, "the harnesses with as-is behaviour on both sides");
  // A synthetic reference registry: the entries the product carries, plus one it
  // does not. The name is made here and is not the name of anything.
  const root = registry(temp("registry"), [...carried, "an-extra-entry"]);
  assert.deepEqual(entriesOfTheReferenceRegistry(root), [...carried, "an-extra-entry"]);
  assert.deepEqual(notCarriedEntries({ referenceRoot: root }), ["an-extra-entry"]);
  // A registry that holds nothing the product lacks gives nothing to take out.
  assert.deepEqual(notCarriedEntries({ referenceRoot: registry(temp("same"), carried) }), []);
  // A tree with no registry at all — the mixture-of-loops baseline — gives nothing.
  assert.deepEqual(notCarriedEntries({ referenceRoot: temp("no-registry") }), []);
});

test("CT-141-129: the port registry decides where the product has one", () => {
  const portRoot = temp("port");
  const file = join(portRoot, "packages", "harness", "src", "registry.ts");
  mkdirSync(dirname(file), { recursive: true });
  // The reader of the port side reads `id: "<name>"` out of the registry of the
  // product (`REGISTRY_SOURCE.port`).
  writeFileSync(
    file,
    `export const REGISTRY = [\n  { id: "one" },\n  { id: "two" },\n];\n`,
    "utf8",
  );
  assert.deepEqual(entriesTheProductCarries(portRoot), ["one", "two"]);
  const referenceRoot = registry(temp("reference"), ["one", "two", "three"]);
  assert.deepEqual(notCarriedEntries({ referenceRoot, portRoot }), ["three"]);
});

// ---------------------------------------------------------------------------
// Taken out before anything is stored or compared
// ---------------------------------------------------------------------------

test("CT-141-129: the entry is taken out of a listing, with its separator", () => {
  const name = "an-extra-entry";
  // The display line of the registry of the baseline: the spelling of every entry
  // joined with " | ", an optional qualifier in brackets.
  const line = `dsh[:provider/model] | claude | codex | ${name}[:label] | prime[:variant]`;
  assert.equal(mentionsOfAnEntry(line, name), 1);
  assert.equal(
    withoutAnEntry(line, name),
    "dsh[:provider/model] | claude | codex | prime[:variant]",
  );
  // A list of names, and a line that says nothing but the entry.
  assert.equal(withoutAnEntry(`["a","${name}","b"]`, name), '["a","b"]');
  assert.equal(withoutAnEntry(`a\n${name}\nb`, name), "a\nb");
  // A word that merely contains the name is not the entry.
  assert.equal(mentionsOfAnEntry(`${name}-and-more`, name), 0);
  assert.equal(mentionsOfAnEntry("nothing of it here", name), 0);
});

test("CT-141-129: N-15 takes the entry out of the reference side and counts it", () => {
  const name = "an-extra-entry";
  const referenceRoot = registry(temp("rule"), ["claude", "dsh", "codex", "prime", name]);
  const capture = {
    scenario: "FX-00/synthetic",
    side: "reference" as const,
    surfaces: {
      stderr: `proposer.sh: unknown backend 'x' (dsh[:provider/model] | claude | ${name}[:label])\n`,
      stdout: "",
    },
    findings: [] as string[],
  };
  const context = {
    scenario: "FX-00/synthetic",
    side: "reference" as const,
    roots: [{ placeholder: "<IMPL>", path: referenceRoot }],
    statePaths: {},
    durationsUnderTest: [] as string[],
    slug: "synthetic",
  };
  const counted = N15.apply(capture, context);
  assert.ok(counted >= 1, "the rule counted the removal");
  assert.equal(
    capture.surfaces.stderr,
    "pass-loop: unknown backend 'x' (dsh[:provider/model] | claude)\n",
    "the entry and its separator are gone, the rest of the line stands, and the same rule has " +
      "replaced the implementation file name with its logical component name",
  );
  assert.equal(mentionsOfAnEntry(JSON.stringify(capture.surfaces), name), 0);

  // The PORT side takes nothing out: an entry the port has and the reference
  // lacks is a difference, never something to remove (F141-FR-024).
  const onThePort = {
    scenario: "FX-00/synthetic",
    side: "port" as const,
    surfaces: { stderr: `a line that names ${name}\n` },
    findings: [] as string[],
  };
  assert.equal(takeOutNotCarried(onThePort, { ...context, side: "port" }), 0);
  assert.equal(onThePort.surfaces.stderr, `a line that names ${name}\n`);
});

// ---------------------------------------------------------------------------
// The check over the files of the oracle
// ---------------------------------------------------------------------------

test("CT-141-129: a name in a file of the oracle fails the check", () => {
  const name = "an-extra-entry";
  const referenceRoot = registry(temp("scan-ref"), ["claude", name]);
  const oracleRoot = temp("scan-oracle");
  mkdirSync(join(oracleRoot, "golden"));
  writeFileSync(join(oracleRoot, "golden", "FX-00.reference.json"), `{"line":"${name}"}\n`, "utf8");
  writeFileSync(join(oracleRoot, "clean.txt"), "nothing of it here\n", "utf8");
  const findings = filesOfTheOracleThatNameAnEntry({ referenceRoot, oracleRoot });
  assert.deepEqual(
    findings.map((f) => f.file),
    ["golden/FX-00.reference.json"],
    "the scan reaches a golden capture, which is where a name would land",
  );
  assert.throws(
    () => assertNoFileOfTheOracleNamesAnEntry({ referenceRoot, oracleRoot }),
    (error: unknown) =>
      error instanceof NotCarriedEntryError &&
      error.message.includes("golden/FX-00.reference.json") &&
      !error.message.includes(name),
    "the failure names the file and not the entry: the report of the oracle is one of the places " +
      "the name may not reach",
  );
});

// ---------------------------------------------------------------------------
// No fixture, no stub name, no imported asset — against the real tree
// ---------------------------------------------------------------------------

test(
  "CT-141-129: no fixture, no stub name and no imported asset name the entry",
  {
    skip: referenceTreeOf("specstride") === undefined ? skipReasonFor("specstride") : false,
  },
  () => {
    const name = theEntryOfTheRealTree() as string;
    // No stub name.
    assert.equal(
      stubExecutableNames().some((stub) => namesAnEntry(stub, name)),
      false,
      "the set of stub names does not hold it (§O.7)",
    );
    // No fixture.
    const fixtures: string[] = [];
    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (namesAnEntry(path, name) || namesAnEntry(readFileSync(path, "utf8"), name)) {
          fixtures.push(path);
        }
      }
    };
    walk(join(PACKAGE, "fixtures"));
    assert.deepEqual(fixtures, [], "no fixture and no imported asset names it (F141-FR-029)");
    // And no file of the package at all, golden captures included.
    assert.deepEqual(
      filesOfTheOracleThatNameAnEntry({ referenceRoot: referenceTreeOf("specstride")!.root }),
      [],
    );
  },
);

test(
  "CT-141-129: the one stream of that entry was not imported",
  {
    skip: referenceTreeOf("specstride") === undefined ? skipReasonFor("specstride") : false,
  },
  () => {
    const tree = referenceTreeOf("specstride")!;
    const name = theEntryOfTheRealTree() as string;
    const asIs = join(tree.root, "lib", "fixtures", "stream-golden", "claude");
    const streams = readdirSync(asIs).filter((file) => file.endsWith(".jsonl"));
    const ofTheEntry = streams.filter((file) => namesAnEntry(file, name));
    assert.equal(ofTheEntry.length, 1, "the baseline holds one such stream");
    const imported = join(
      PACKAGE,
      "fixtures",
      "assets",
      "streams",
      `specstride@${tree.commit.slice(0, 7)}`,
      "lib",
      "fixtures",
      "stream-golden",
      "claude",
    );
    const here = readdirSync(imported).filter((file) => file.endsWith(".jsonl"));
    assert.ok(here.length > 0, "the streams are imported");
    assert.equal(here.length, streams.length - 1, "18 of the 19 streams are imported (T123)");
    assert.deepEqual(
      here.filter((file) => namesAnEntry(file, name)),
      [],
      "the stream of that entry is not among them (F141-FR-012, §O.7)",
    );
    // Every imported stream is byte for byte the file of the baseline.
    for (const file of here) {
      assert.deepEqual(
        readFileSync(join(imported, file)),
        readFileSync(join(asIs, file)),
        `${file} is imported unchanged`,
      );
    }
  },
);
