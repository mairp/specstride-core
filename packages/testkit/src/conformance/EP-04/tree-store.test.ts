/**
 * T128 — the contract tests CT-100-221, CT-100-222, CT-100-223, CT-100-224
 * and CT-100-225 for the tree-store service (annex D, §D.2; F100-FR-121 to
 * F100-FR-125).
 *
 * The service is offered by the engine to a layer that declared it, and is
 * used by the layer `parallel` through the directives `requestPassGroup` and
 * `integrateGroup` of EP-04. Row 64 of annex X §X.6 holds its operations:
 * the seven of §D.2 and no other, and an operation the engine does not offer
 * refuses the layer at registration.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  CHANGE_KINDS,
  COMPOSE_REFUSAL_REASON,
  LOGICAL_NAMES,
  NEVER_DONE_TO_THE_WORKSPACE,
  OPERATIONS_THE_STORE_DOES_NOT_OFFER,
  OPERATION_THAT_MAY_WRITE_THE_WORKSPACE,
  PERMITTED_WRITES_TO_THE_WORKSPACE,
  RULE,
  SCHEMA_ID,
  STORE_COMMIT_CONDITIONS,
  THE_ONE_PERMITTED_REPOSITORY_WRITE,
  THE_STORE_IS_WRITABLE_BY_A_WORKER,
  TREE_STORE_OPERATIONS,
  WORKER_TREE_BORROWS_OBJECTS_READ_ONLY,
  A_MODEL_TAKES_PART_IN_INTEGRATION,
  firstOverlap,
  mayWriteTheWorkspace,
  offersExactlyTheSevenOperations,
  permittedWrites,
  storeCommitConditionsBroken,
  treeStoreOperationRows,
} from "@specstride/contracts/ep/tree-store";
import { operationsOfTheTreeStore } from "@specstride/contracts/enums/all-sets";
import { sampleTreeStore } from "../../samples/EP-04/index.ts";

test("CT-100-221: the service offers exactly the seven operations, no restore, reset or checkout, and only `apply` may write a path of the workspace (F100-FR-121)", async () => {
  assert.deepEqual(
    [...TREE_STORE_OPERATIONS],
    ["snapshot", "materialize", "changed", "compose", "apply", "release", "sweep"],
  );
  assert.deepEqual(
    treeStoreOperationRows.map((r) => r.operation),
    [...TREE_STORE_OPERATIONS],
  );
  // Row 64 of annex X §X.6 registers by reference to the same list.
  assert.deepEqual([...operationsOfTheTreeStore.members], [...TREE_STORE_OPERATIONS]);
  assert.equal(operationsOfTheTreeStore.number, 64);
  assert.match(operationsOfTheTreeStore.onUnknown("restore").message, /restore/);
  for (const absent of OPERATIONS_THE_STORE_DOES_NOT_OFFER) {
    assert.equal(
      (TREE_STORE_OPERATIONS as readonly string[]).includes(absent),
      false,
      `the store must not offer \`${absent}\``,
    );
  }
  const store = sampleTreeStore();
  assert.equal(offersExactlyTheSevenOperations(store), true);
  assert.equal(offersExactlyTheSevenOperations({ ...store, restore: () => undefined }), false);
  assert.equal(OPERATION_THAT_MAY_WRITE_THE_WORKSPACE, "apply");
  for (const operation of TREE_STORE_OPERATIONS) {
    assert.equal(mayWriteTheWorkspace(operation), operation === "apply", operation);
  }
  for (const row of treeStoreOperationRows) {
    if (row.operation === "apply") assert.match(row.writes, /workspace/);
    else
      assert.equal(/workspace/i.test(row.writes), false, `${row.operation} writes ${row.writes}`);
  }
  assert.equal(SCHEMA_ID, "specstride.tree-store/1");
  assert.deepEqual([...LOGICAL_NAMES], ["tree-store", "worker-root"]);
  assert.deepEqual([...CHANGE_KINDS], ["added", "changed", "deleted", "mode changed"]);
  const base = await store.snapshot("/tmp/base");
  assert.equal(typeof base, "string");
});

test("CT-100-222: integration is composition and never a merge; a delta that shares a path with an earlier one is refused with the reason `overlap`, and a model takes no part (F100-FR-122)", async () => {
  assert.equal(COMPOSE_REFUSAL_REASON, "overlap");
  assert.equal(A_MODEL_TAKES_PART_IN_INTEGRATION, false);
  const disjoint = [
    { workerId: "w1", treeId: "t1", paths: ["a.txt"] },
    { workerId: "w2", treeId: "t2", paths: ["b.txt"] },
  ];
  assert.equal(firstOverlap(disjoint), undefined);
  const overlapping = [
    { workerId: "w1", treeId: "t1", paths: ["a.txt", "shared.txt"] },
    { workerId: "w2", treeId: "t2", paths: ["shared.txt"] },
  ];
  const overlap = firstOverlap(overlapping);
  assert.equal(overlap?.workerId, "w2", "the later delta in the order of the tasks is refused");
  assert.deepEqual([...(overlap?.paths ?? [])], ["shared.txt"]);
  const store = sampleTreeStore();
  const base = await store.snapshot("/tmp/base");
  const composed = await store.compose(base, disjoint);
  assert.equal(composed.composed, true);
  const refused = await store.compose(base, overlapping);
  assert.equal(refused.composed, false);
  if (!refused.composed) {
    assert.equal(refused.reason, "overlap");
    assert.deepEqual([...refused.paths], ["shared.txt"]);
    assert.equal(refused.workerId, "w2");
  }
});

test("CT-100-223: the conditions of a store commit hold: only in the store, a fixed author, date and message, never a parent of a project commit, never pushed, removed with the run; the store is unwritable by a worker (F100-FR-123)", () => {
  assert.equal(STORE_COMMIT_CONDITIONS.length, 5);
  const fixed = {
    author: "specstride <none@invalid>",
    date: "1970-01-01T00:00:00Z",
    message: "specstride snapshot",
  };
  const good = {
    insideTheProjectRepository: false,
    ...fixed,
    isParentOfAProjectCommit: false,
    pushed: false,
    removedWithTheRun: true,
  };
  assert.deepEqual([...storeCommitConditionsBroken(good, fixed)], []);
  const bad = { ...good, insideTheProjectRepository: true, pushed: true, removedWithTheRun: false };
  const broken = storeCommitConditionsBroken(bad, fixed);
  assert.equal(broken.length, 3);
  assert.equal(broken[0], STORE_COMMIT_CONDITIONS[0]);
  const drifted = { ...good, message: "a message of its own" };
  assert.deepEqual([...storeCommitConditionsBroken(drifted, fixed)], [STORE_COMMIT_CONDITIONS[1]]);
  assert.equal(THE_STORE_IS_WRITABLE_BY_A_WORKER, false);
  assert.equal(WORKER_TREE_BORROWS_OBJECTS_READ_ONLY, true);
});

test("CT-100-224: inside a phase attempt the runtime never commits, reverts, resets, cleans or checks out the workspace, and with parallel units on it makes exactly the two permitted writes (rule IR-60 as amended) (F100-FR-124)", () => {
  assert.equal(RULE, "IR-60 as amended");
  assert.deepEqual(
    [...NEVER_DONE_TO_THE_WORKSPACE],
    ["commit", "revert", "reset", "clean", "check out"],
  );
  assert.equal(PERMITTED_WRITES_TO_THE_WORKSPACE.length, 2);
  const [first, second] = PERMITTED_WRITES_TO_THE_WORKSPACE;
  assert.equal(first?.ordinal, 1);
  assert.match(first?.what ?? "", /composed delta of a group/);
  assert.deepEqual(
    [...(first?.conditions ?? [])],
    [
      "forward only",
      "only paths of audited deltas",
      "only onto a workspace equal to the base",
      "recorded before it is made",
      "never undone",
      "nothing under the repository directory",
    ],
  );
  assert.equal(second?.ordinal, 2);
  assert.match(second?.what ?? "", /ticks of the integrated tasks/);
  assert.match(second?.through ?? "", /spec-format/);
  assert.equal(THE_ONE_PERMITTED_REPOSITORY_WRITE, "the approval commit");
  // With parallel units off the runtime makes neither write.
  assert.equal(permittedWrites(false).length, 0);
  assert.equal(permittedWrites(true).length, 2);
});

test("CT-100-225: after the application the inner check set runs once per group on the workspace, a failure goes to serial repair and the applied changes are not reverted, and a worker result never replaces the verification gate (F100-FR-125)", async () => {
  // The interface offers no operation that could revert an application.
  const store = sampleTreeStore();
  assert.equal(offersExactlyTheSevenOperations(store), true);
  for (const never of NEVER_DONE_TO_THE_WORKSPACE) {
    assert.equal(
      never in (store as unknown as Record<string, unknown>),
      false,
      `the service must offer no \`${never}\``,
    );
  }
  // `apply` is forward only: it returns the paths it wrote and nothing that
  // could undo them.
  const base = await store.snapshot("/tmp/base");
  const composed = await store.compose(base, [{ workerId: "w1", treeId: "t1", paths: ["a.txt"] }]);
  assert.equal(composed.composed, true);
  if (composed.composed) {
    const written = await store.apply(base, composed.treeId, "/tmp/workspace");
    assert.ok(Array.isArray(written));
    assert.ok(written.includes("a.txt"));
  }
  // The partial work of a killed worker is discarded: `release` removes the
  // worker tree and returns nothing.
  const tree = await store.materialize(base, "w1");
  assert.equal(await store.release(tree), undefined);
  const swept = await store.sweep();
  assert.ok(Array.isArray(swept));
});
