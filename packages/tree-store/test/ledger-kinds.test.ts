/**
 * T006 — the thirteen ledger record kinds of the namespace `parallel`, with
 * the data of each (F143-FR-023, F143-FR-025).
 *
 * The registry itself is a module of the CORE
 * (`packages/core/src/parallel/ledger-kinds.ts`), because the records are an
 * engine decision and nothing of them touches the file system. The test
 * lives here, in the edge package, for the same reason as the package-graph
 * test of T003: it READS FILES — `spec.md`, `data-model.md` and the contract
 * data under `data/` — to show that the registry says what the specification
 * says, and a core package may not read a file.
 *
 * What it observes:
 *
 *  1 thirteen kinds, in the order of the state sequence, equal to the list of
 *    F143-FR-023 in `spec.md` and to `data/ledger-kinds.json` of T004;
 *  2 the data of every kind is the row of `data-model.md`, field by field;
 *  3 `worker_started` and `worker_ended` carry `workerId` and no other kind
 *    does;
 *  4 the closed set of row 184 and its rule for an unknown value;
 *  5 the refusals: an unknown kind, the wrong namespace, a missing or a
 *    misplaced `workerId`, a missing field of `data`;
 *  6 the schema id the core states equals the one feature 100 owns.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLOSED_SET_ROW,
  FIRST_KIND,
  KINDS_THAT_CARRY_WORKER_ID,
  KIND_COUNT,
  LAST_KIND,
  LEDGER_SCHEMA,
  MERGE_DONE_RECORDS_A_COMPOSITION,
  NAMESPACE,
  ON_UNKNOWN_KIND,
  PARALLEL_LEDGER_KINDS,
  PARALLEL_LEDGER_KIND_REGISTRY,
  AN_INVALID_LEDGER_STOPS_THE_RUN,
  EFFECT_OF_AN_INVALID_LEDGER,
  carriesWorkerId,
  dataFieldsOf,
  isParallelLedgerKind,
  isWellFormed,
  kindAfter,
  onUnknownKind,
  refusalsOf,
  registrationOf,
} from "../../core/src/parallel/ledger-kinds.ts";
import {
  SCHEMA_ID as LEDGER_SCHEMA_OF_FEATURE_100,
  EFFECT_OF_A_BROKEN_LEDGER,
  A_BROKEN_LEDGER_STOPS_THE_RUN,
} from "../../contracts/src/records/ledger-record.ts";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const FEATURE = join(REPOSITORY_ROOT, "specs", "143-parallel-engine-services");

const THE_THIRTEEN = [
  "group_planned",
  "group_started",
  "worker_started",
  "worker_ended",
  "group_barrier",
  "audit_done",
  "merge_done",
  "apply_started",
  "applied",
  "ticks_applied",
  "merge_check_started",
  "merge_check_finished",
  "group_closed",
];

test("T006 thirteen kinds, in the order of the state sequence", () => {
  assert.equal(PARALLEL_LEDGER_KINDS.length, 13);
  assert.equal(KIND_COUNT, 13);
  assert.deepEqual([...PARALLEL_LEDGER_KINDS], THE_THIRTEEN);
  assert.equal(NAMESPACE, "parallel");
  assert.equal(FIRST_KIND, "group_planned");
  assert.equal(LAST_KIND, "group_closed");
  assert.equal(new Set(PARALLEL_LEDGER_KINDS).size, 13, "no kind twice");

  // The registry is the same list, with an ordinal from 1 and no gap.
  assert.deepEqual(
    PARALLEL_LEDGER_KIND_REGISTRY.map((r) => r.kind),
    THE_THIRTEEN,
  );
  PARALLEL_LEDGER_KIND_REGISTRY.forEach((r, i) => assert.equal(r.ordinal, i + 1, r.kind));

  // The state sequence of `data-model.md`, read forwards.
  for (let i = 0; i < THE_THIRTEEN.length - 1; i++) {
    assert.equal(kindAfter(THE_THIRTEEN[i] as never), THE_THIRTEEN[i + 1]);
  }
  assert.equal(kindAfter(LAST_KIND), undefined, "after `group_closed` nothing is repeated");
});

test("T006 the kinds are the list of F143-FR-023 in spec.md and of the contract data", () => {
  const spec = readFileSync(join(FEATURE, "spec.md"), "utf8");
  const requirement = spec.split("\n").find((line) => line.startsWith("- **F143-FR-023**"));
  assert.ok(requirement !== undefined, "F143-FR-023 is in spec.md");
  const named = [...requirement.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
  // The requirement names the thirteen in order, after the words "thirteen kinds".
  const inOrder = named.filter((n) => THE_THIRTEEN.includes(n as string));
  assert.deepEqual(inOrder, THE_THIRTEEN, "spec.md names the thirteen, in this order");

  // `data/ledger-kinds.json` (T004), which `data.test.ts` compares with spec.md.
  const data = JSON.parse(
    readFileSync(join(PACKAGE_ROOT, "data", "ledger-kinds.json"), "utf8"),
  ) as { namespace: string; schema: string; kinds: { kind: string; worker: boolean }[] };
  assert.equal(data.namespace, NAMESPACE);
  assert.equal(data.schema, LEDGER_SCHEMA);
  assert.deepEqual(
    data.kinds.map((k) => k.kind),
    THE_THIRTEEN,
  );
  // The worker flag of the data and of the registry are the same statement.
  for (const row of data.kinds) {
    assert.equal(
      carriesWorkerId(row.kind as never),
      row.worker,
      `\`${row.kind}\` carries workerId: ${String(row.worker)}`,
    );
  }

  // The closed set of row 184, and the rule for an unknown value.
  const closed = JSON.parse(
    readFileSync(join(PACKAGE_ROOT, "data", "closed-sets.json"), "utf8"),
  ) as { sets: { name: string; annexXRow: number; members: string[]; unknown: string }[] };
  const set = closed.sets.find((s) => s.name === "ledger-kinds-parallel");
  assert.ok(set !== undefined);
  assert.equal(set.annexXRow, CLOSED_SET_ROW);
  assert.deepEqual(set.members, THE_THIRTEEN);
  assert.equal(set.unknown, ON_UNKNOWN_KIND);
  // And row 184 of annex X §X.6, as `spec.md` writes it, says the same.
  const row = spec.split("\n").find((l) => l.includes("| 184 | Design |"));
  assert.ok(row !== undefined, "row 184 is in spec.md");
  assert.match(row, /The thirteen of F143-FR-023/);
  assert.match(row, /read as invalid inside the group/);
  assert.match(row, /off for the phase attempt/);
});

test("T006 the data of every kind is the row of data-model.md", () => {
  // The expected fields, kind by kind, read from the table of `data-model.md`
  // by a reader of this test; the assertion below shows the table still says
  // it, so neither side can drift alone.
  const expected: Record<string, readonly string[]> = {
    group_planned: ["groupId", "tasks", "planHash"],
    group_started: ["baseTree", "workspaceFingerprint"],
    worker_started: ["task", "passId", "passOrdinal", "treeFingerprint", "pid", "startTime"],
    worker_ended: ["endCause", "treeId", "treeFingerprint", "usage"],
    group_barrier: ["workspaceFingerprint", "workerFingerprints"],
    audit_done: ["audits"],
    merge_done: ["composedTreeId", "acceptedWorkers"],
    apply_started: ["paths"],
    applied: ["workspaceFingerprint"],
    ticks_applied: ["taskIds"],
    merge_check_started: ["fingerprint", "checkManifestHash"],
    merge_check_finished: ["fingerprint", "results", "conditions"],
    group_closed: ["outcome", "workerOutcomes", "treesRemoved"],
  };
  for (const kind of PARALLEL_LEDGER_KINDS) {
    assert.deepEqual([...dataFieldsOf(kind)], [...(expected[kind] as readonly string[])], kind);
    // Every field says what it carries, so a record can be read without the annex.
    for (const field of registrationOf(kind).data) {
      assert.ok(field.carries.length > 0, `${kind}.${field.field} says what it carries`);
    }
  }
  // No kind is left without data.
  for (const kind of PARALLEL_LEDGER_KINDS) assert.ok(dataFieldsOf(kind).length > 0, kind);

  // The table of `data-model.md` still holds the thirteen rows, in order, and
  // what each row says is what the registry's fields are named for.
  const model = readFileSync(join(FEATURE, "data-model.md"), "utf8");
  const rows = [...model.matchAll(/^\| `([a-z_]+)` \| (Yes|No) \| (.+?) \|$/gm)];
  assert.deepEqual(
    rows.map((r) => r[1]),
    THE_THIRTEEN,
    "the table of data-model.md holds the thirteen rows in order",
  );
  for (const row of rows) {
    const kind = row[1] as string;
    assert.equal(carriesWorkerId(kind as never), row[2] === "Yes", `${kind}: carries workerId`);
  }
  // Two rows, read in full, show the fields are the annex's and not invented.
  const workerEnded = rows.find((r) => r[1] === "worker_ended")?.[3] ?? "";
  assert.match(workerEnded, /End cause/);
  assert.match(workerEnded, /final `treeId`/);
  assert.match(workerEnded, /usage or `unknown`/);
  const groupClosed = rows.find((r) => r[1] === "group_closed")?.[3] ?? "";
  assert.match(groupClosed, /Outcome of the group/);
  assert.match(groupClosed, /per worker its outcome/);
  assert.match(groupClosed, /trees removed/);
});

test("T006 only a record of a worker carries `workerId`", () => {
  assert.deepEqual([...KINDS_THAT_CARRY_WORKER_ID], ["worker_started", "worker_ended"]);
  for (const kind of PARALLEL_LEDGER_KINDS) {
    const expected = kind === "worker_started" || kind === "worker_ended";
    assert.equal(carriesWorkerId(kind), expected, kind);
    assert.equal(registrationOf(kind).workerId, expected, kind);
  }
});

test("T006 the closed set refuses an unknown kind and never stops the run", () => {
  for (const kind of PARALLEL_LEDGER_KINDS) assert.equal(isParallelLedgerKind(kind), true, kind);
  for (const outside of ["merge", "group_opened", "worker", "", "apply", 7, null, undefined]) {
    assert.equal(isParallelLedgerKind(outside), false, String(outside));
  }
  const unknown = onUnknownKind("group_opened");
  assert.match(unknown.message, /group_opened/);
  assert.match(unknown.message, /the layer is off for the phase attempt/);
  assert.equal(unknown.effect, EFFECT_OF_AN_INVALID_LEDGER);
  assert.equal(AN_INVALID_LEDGER_STOPS_THE_RUN, false);
  // The effect is the one feature 100 states for a broken ledger.
  assert.equal(EFFECT_OF_AN_INVALID_LEDGER, EFFECT_OF_A_BROKEN_LEDGER);
  assert.equal(AN_INVALID_LEDGER_STOPS_THE_RUN, A_BROKEN_LEDGER_STOPS_THE_RUN);
  assert.throws(() => registrationOf("group_opened" as never), /no registration/);
});

test("T006 a record is read against the registry: namespace, worker id, data", () => {
  const good = {
    ns: "parallel",
    kind: "worker_ended",
    workerId: "w-1",
    data: { endCause: "ended", treeId: "t2", treeFingerprint: "f", usage: "unknown" },
  };
  assert.deepEqual(refusalsOf(good), []);
  assert.equal(isWellFormed(good), true);

  // The wrong namespace.
  assert.deepEqual(
    refusalsOf({ ...good, ns: "core" }).map((r) => r.reason),
    ["wrong-namespace"],
  );
  // An unknown kind, and nothing else is reported after it.
  assert.deepEqual(
    refusalsOf({ ...good, kind: "worker_finished" }).map((r) => r.reason),
    ["unknown-kind"],
  );
  // A record of a worker without `workerId`.
  const { workerId: _dropped, ...withoutWorker } = good;
  assert.deepEqual(
    refusalsOf(withoutWorker).map((r) => r.reason),
    ["missing-worker-id"],
  );
  // A record of the group that carries one.
  assert.deepEqual(
    refusalsOf({
      ns: "parallel",
      kind: "applied",
      workerId: "w-1",
      data: { workspaceFingerprint: "f" },
    }).map((r) => r.reason),
    ["worker-id-not-of-this-kind"],
  );
  // A missing field of `data`, named with what it carries.
  const missing = refusalsOf({
    ns: "parallel",
    kind: "apply_started",
    data: {},
  });
  assert.deepEqual(
    missing.map((r) => r.reason),
    ["missing-data-field"],
  );
  assert.match(missing[0]?.detail ?? "", /base and composed object id/);

  // Every kind: a record that carries every field is well formed, and one
  // that drops any single field is not.
  for (const kind of PARALLEL_LEDGER_KINDS) {
    const data = Object.fromEntries(dataFieldsOf(kind).map((f) => [f, "x"]));
    const envelope = {
      ns: NAMESPACE,
      kind,
      data,
      ...(carriesWorkerId(kind) ? { workerId: "w-1" } : {}),
    };
    assert.equal(isWellFormed(envelope), true, kind);
    for (const field of dataFieldsOf(kind)) {
      const short = { ...data } as Record<string, unknown>;
      delete short[field];
      assert.equal(isWellFormed({ ...envelope, data: short }), false, `${kind} without ${field}`);
    }
  }
});

test("T006 the schema id is the one feature 100 owns, and `merge_done` records a composition", () => {
  assert.equal(LEDGER_SCHEMA, LEDGER_SCHEMA_OF_FEATURE_100);
  assert.equal(LEDGER_SCHEMA, "specstride.ledger/1");
  assert.equal(MERGE_DONE_RECORDS_A_COMPOSITION, true);
  const model = readFileSync(join(FEATURE, "data-model.md"), "utf8");
  assert.match(model, /The kind `merge_done` keeps its name from R29; it records a composition\./);
});
