/**
 * T004 — the data of feature 143 in the package, compared with `spec.md`.
 *
 * The files `data/closed-sets.json` and `data/ledger-kinds.json` are the data
 * this feature owns, copied from `specs/143-parallel-engine-services/contracts/`
 * so that the package carries them and no run has to read the specification
 * tree. `contracts/README.md` states the rule this test enforces:
 *
 *   > Where a file and `spec.md` differ, `spec.md` stands.
 *
 * So the test does two different things, and the second is the one that
 * matters:
 *
 *  1 IT COMPARES THE COPY WITH ITS SOURCE under `specs/`, byte for byte, so a
 *    copy that drifted is caught. Where the specification tree is absent the
 *    comparison reports a SKIP WITH ITS REASON and never a pass (the form of
 *    `tests/characterization/149/bump-table-load.test.ts`).
 *  2 IT COMPARES THE DATA WITH `spec.md` ITSELF — with the member lists that
 *    F143-FR-001, F143-FR-012 and F143-FR-023 write out in prose, parsed out of
 *    the requirement text. That is the comparison the README asks for: it holds
 *    even when both JSON files drifted together, because the authority is the
 *    prose and not either file.
 *
 * The seven operations are also compared with the closed set of the same
 * operations in `@specstride/contracts` (`ep/tree-store.ts`), so the package,
 * the contract and the specification cannot disagree three ways.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { TREE_STORE_OPERATIONS } from "@specstride/contracts/ep/tree-store";
import closedSets from "../data/closed-sets.json" with { type: "json" };
import ledgerKinds from "../data/ledger-kinds.json" with { type: "json" };

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const FEATURE = "143-parallel-engine-services";
const CONTRACTS_DIRECTORY =
  process.env["SPECSTRIDE_143_CONTRACTS"] ?? join(REPOSITORY_ROOT, "specs", FEATURE, "contracts");
const SPEC_FILE =
  process.env["SPECSTRIDE_143_SPEC"] ?? join(REPOSITORY_ROOT, "specs", FEATURE, "spec.md");

/** The two files this package carries, and the set each one holds. */
const FILES = ["closed-sets.json", "ledger-kinds.json"] as const;

type ClosedSetsFile = {
  readonly feature: string;
  readonly sets: readonly {
    readonly name: string;
    readonly annexXRow: number;
    readonly closedBy: string;
    readonly members: readonly string[];
    readonly unknown: string;
  }[];
};

type LedgerKindsFile = {
  readonly namespace: string;
  readonly schema: string;
  readonly kinds: readonly { readonly kind: string; readonly worker: boolean }[];
};

const sets = closedSets as ClosedSetsFile;
const kinds = ledgerKinds as LedgerKindsFile;

function setNamed(name: string): ClosedSetsFile["sets"][number] {
  const found = sets.sets.find((s) => s.name === name);
  assert.ok(found !== undefined, `the file must hold the set ${name}`);
  return found;
}

/**
 * The backticked values of the one line of `spec.md` that holds a requirement
 * id. The requirements of this feature write every member of a closed set in
 * backticks on the requirement's own line, which is what makes the prose
 * mechanically comparable.
 */
function backtickedOfRequirement(spec: string, requirement: string): readonly string[] {
  const line = spec.split("\n").find((l) => l.includes(`**${requirement}**`));
  assert.ok(line !== undefined, `${requirement} must be in ${SPEC_FILE}`);
  return Object.freeze([...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]));
}

test("T004 the data of the package is the data of the contracts directory, byte for byte", () => {
  for (const file of FILES) {
    const source = join(CONTRACTS_DIRECTORY, file);
    if (!existsSync(source)) {
      // A skip with its reason, never a pass.
      assert.ok(true);
      process.stdout.write(
        `# skip: ${source} is absent, so the copy of ${file} was not compared with its source\n`,
      );
      continue;
    }
    assert.equal(
      readFileSync(join(PACKAGE_ROOT, "data", file), "utf8"),
      readFileSync(source, "utf8"),
      `data/${file} must equal ${source}`,
    );
  }
});

test("T004 the data of the package is the data of spec.md: the seven tree-store operations (F143-FR-001)", () => {
  const spec = readFileSync(SPEC_FILE, "utf8");
  const operations = setNamed("tree-store-operations");

  // The prose of F143-FR-001 names the seven operations.
  const quoted = backtickedOfRequirement(spec, "F143-FR-001");
  for (const member of operations.members) {
    assert.ok(
      quoted.includes(member),
      `F143-FR-001 must name the operation ${member}; it names ${quoted.join(", ")}`,
    );
  }
  assert.equal(operations.members.length, 7, "seven operations and no other");

  // And the three operations the store does NOT offer are not members.
  for (const absent of ["restore", "reset", "checkout"]) {
    assert.ok(!operations.members.includes(absent), `${absent} is not an operation of the store`);
  }

  // The contract of feature 100 holds the same seven, in the same order.
  assert.deepEqual([...operations.members], [...TREE_STORE_OPERATIONS]);
});

test("T004 the data of the package is the data of spec.md: the four worker outcomes (F143-FR-012)", () => {
  const spec = readFileSync(SPEC_FILE, "utf8");
  const outcomes = setNamed("worker-outcomes");
  const quoted = backtickedOfRequirement(spec, "F143-FR-012");
  for (const member of outcomes.members) {
    assert.ok(quoted.includes(member), `F143-FR-012 must name the outcome ${member}`);
  }
  assert.deepEqual([...outcomes.members], ["integrated", "refused", "killed", "paused"]);
  // The unknown-value rule of the row: an outcome a reader does not know is
  // read as `refused`, which charges nothing to the task (F143-FR-012).
  assert.equal(outcomes.unknown, "refused");
  assert.ok(quoted.includes("refused"));
});

test("T004 the data of the package is the data of spec.md: the thirteen ledger kinds (F143-FR-023)", () => {
  const spec = readFileSync(SPEC_FILE, "utf8");
  const set = setNamed("ledger-kinds-parallel");
  const quoted = backtickedOfRequirement(spec, "F143-FR-023");

  // Thirteen, in the order the requirement writes them.
  assert.equal(set.members.length, 13, "thirteen kinds");
  const inTheProse = quoted.filter((q) => set.members.includes(q));
  assert.deepEqual(
    inTheProse,
    [...set.members],
    "the kinds of the closed set, in the order F143-FR-023 writes them",
  );

  // `ledger-kinds.json` holds the same thirteen, in the same order.
  assert.deepEqual(
    kinds.kinds.map((k) => k.kind),
    [...set.members],
    "ledger-kinds.json and closed-sets.json agree, in order",
  );
  assert.equal(kinds.namespace, "parallel");

  // Every record of a worker carries `workerId` (F143-FR-023); the two kinds
  // that are a worker's are `worker_started` and `worker_ended`.
  assert.deepEqual(
    kinds.kinds.filter((k) => k.worker).map((k) => k.kind),
    ["worker_started", "worker_ended"],
  );
  assert.ok(quoted.includes("workerId"), "F143-FR-023 names the field workerId");
});

test("T004 the data names this feature and the rows of annex X §X.6", () => {
  assert.equal(sets.feature, FEATURE);
  assert.deepEqual(
    sets.sets.map((s) => s.annexXRow),
    [62, 64, 184],
    "the rows of annex X §X.6 the three sets hold",
  );
  for (const set of sets.sets) {
    assert.equal(set.closedBy, "design");
    assert.ok(set.unknown.length > 0, `the set ${set.name} must state its unknown-value rule`);
  }
});
