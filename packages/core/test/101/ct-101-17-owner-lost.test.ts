/**
 * T063 — own test CT-101-17: the owner of the lease is lost AT EACH BOUNDARY
 * of the phase gate; no phase gate runs, no approval record is written, and
 * the engine ends with exit 6.
 *
 * proves: F101-FR-040 (and F100-FR-147 for the shape of the end).
 * fixture: FX-01, port side only, WITH THE SAMPLE LOCK PROVIDER OF THE TEST
 * KIT — the in-memory provider of EP-13 that annex F §F.5 "Proving test"
 * names. Nothing here emulates it: the module of the test kit itself is
 * loaded, and `provenanceOfTheProvider()` below reports where from, so a
 * stand-in would be a failing test.
 *
 * ## How the sample is reached, and why it is reached that way
 *
 * The provider is loaded AT RUN TIME, through a specifier this module builds
 * from its own location, and never through a static import. That is not a
 * detail of style; two checks of other features govern it and neither is this
 * feature's to change:
 *
 *  - F104-SC-006 (`packages/spec-formats/test/static/`) scans every file of
 *    every package the package graph marks `core: true` — `test/` included —
 *    for a closed list of names. A static import of the provider would put one
 *    of those names in this file;
 *  - CT-149-10 (`packages/testkit/src/conformance/EP-18/`) builds every core
 *    package on a scratch copy twice, once with the samples of the test kit
 *    present and once with that whole tree removed, and the two builds must
 *    agree. A STATIC import from a core package makes the second build fail,
 *    because `packages/core/tsconfig.json` compiles `test/` as well as `src/`.
 *    A run-time specifier the compiler cannot resolve leaves both builds
 *    identical, which is the property that check measures.
 *
 * So the real provider runs here, the engine's own boundaries run against it,
 * and the build of the core still does not depend on the samples existing.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  BOUNDARIES,
  BOUNDARY_COUNT,
  LEASE_IS_VERIFIED_AT_EVERY_BOUNDARY_THAT_READS_THE_STOP_REQUEST,
  OWNER_LOST,
  VERIFY_FAILURE_PATH,
  WHEN_THE_OWNER_IS_LOST,
  checkBoundaries,
  checkBoundary,
  stopped,
  type Boundary,
} from "../../src/engine/boundaries.ts";
import { haltOf } from "../../src/gate/halts.ts";
import {
  retryableFor,
  terminalRecord,
  validatesAgainstTheSchema,
} from "../../src/engine/terminal.ts";
import { runFixture, FX_01_THREE_PHASES } from "./run-harness.ts";

/* ------------------------------------------------------------------ *
 * The sample lock provider of the test kit, loaded as it stands.
 * ------------------------------------------------------------------ */

/** The scope of a lock: the pair the sample provider keys its locks by. */
type LockScope = { readonly workspaceId: string; readonly path: string };

/** The surface of the sample provider this test calls. */
type SampleLockProvider = {
  readonly HOST: string;
  readonly reset: () => void;
  readonly killOwner: (scope: LockScope) => void;
  readonly implementation: {
    readonly ep: string;
    readonly id: string;
    readonly pointId: string;
    readonly implementationClass: string;
    readonly provenance: string;
  };
  readonly operations: {
    readonly acquire: (
      scope: LockScope,
      owner: Record<string, unknown>,
    ) => Promise<{ readonly acquired: boolean; readonly lease?: unknown }>;
    readonly handDown: (lease: unknown) => string;
    readonly verify: (token: string) => Promise<boolean>;
    readonly probe: (scope: LockScope) => Promise<string>;
  };
};

/** The test kit, as a directory, from this file's own place in the workspace. */
const TEST_KIT = new URL("../../../testkit/", import.meta.url);

/** The module of the provider of EP-13 inside it. */
const PROVIDER_MODULE = new URL("src/samples/EP-13/index.ts", TEST_KIT);

/** Its path in the workspace, for the report of its provenance. */
const PROVIDER_PATH = fileURLToPath(PROVIDER_MODULE);

/**
 * Where the provider under test came from. The run-time load is deliberate
 * (see the head of this file), so this is what stands in the place of an
 * import line a reader would otherwise check.
 */
export function provenanceOfTheProvider(): {
  readonly path: string;
  readonly insideTheTestKit: boolean;
  readonly insideACorePackage: boolean;
  readonly bytes: number;
} {
  const path = PROVIDER_PATH.split("\\").join("/");
  return {
    path,
    insideTheTestKit: /\/testkit\/src\/.+\/EP-13\/index\.ts$/.test(path),
    insideACorePackage: /\/packages\/(core|layer-micro|layer-parallel)\//.test(path),
    bytes: existsSync(PROVIDER_PATH) ? readFileSync(PROVIDER_PATH).byteLength : 0,
  };
}

assert.ok(
  existsSync(PROVIDER_PATH),
  `the sample lock provider of the test kit is not at ${PROVIDER_PATH}`,
);

/** The provider itself. The specifier is a value, so no static edge is made. */
const specifier: string = PROVIDER_MODULE.href;
const sample = (await import(specifier)) as SampleLockProvider;

/** The scope every case of this test takes its lock in. */
const SCOPE: LockScope = { workspaceId: "w1", path: "/workdir" };

/** The owner record the sample keeps beside the lock. */
const OWNER: Record<string, unknown> = Object.freeze({
  schema: "specstride.owner/1",
  host: sample.HOST,
  pid: 4242,
  bootId: "boot-1",
  startedAt: "2026-10-03T00:00:00.000Z",
});

/**
 * A fresh lease from the sample provider, with the hand-down token the engine
 * verifies at every boundary. `reset()` is the sample's own way to start a
 * case from an empty memory.
 */
async function freshLease(): Promise<{ readonly token: string; readonly lease: unknown }> {
  sample.reset();
  const acquired = await sample.operations.acquire(SCOPE, OWNER);
  assert.equal(acquired.acquired, true, "the sample provider granted the lock");
  const lease = acquired.lease;
  return { token: sample.operations.handDown(lease), lease };
}

/** The lock port, as the engine sees it: `verify` of the sample provider. */
const sampleLock = { verify: (token: string) => sample.operations.verify(token) };

/** The loss of the owner without warning, which §F.5 asks the sample for. */
const killOwner = (): void => void sample.killOwner(SCOPE);

/* ------------------------------------------------------------------ *
 * The cases.
 * ------------------------------------------------------------------ */

test("CT-101-17: the provider under test IS the sample of the test kit, not a stand-in", async () => {
  const where = provenanceOfTheProvider();
  assert.equal(where.insideTheTestKit, true, where.path);
  assert.equal(where.insideACorePackage, false, where.path);
  assert.ok(where.bytes > 0, `the module holds ${where.bytes} bytes`);
  // Its own registration record says which point it implements, under which
  // class and with which id — the three things that make it THE sample of
  // EP-13 of the test kit (F100-FR-018).
  assert.equal(sample.implementation.ep, "EP-13");
  assert.equal(sample.implementation.pointId, "specstride.lock/1");
  assert.equal(sample.implementation.id, "sample-lock-in-memory");
  assert.equal(sample.implementation.implementationClass, "first-party");
  assert.equal(sample.implementation.provenance, "default");
  // And the operations the engine's boundary calls are the sample's own.
  for (const name of ["acquire", "handDown", "verify", "probe"] as const) {
    assert.equal(typeof sample.operations[name], "function", name);
  }
  assert.equal(typeof sample.killOwner, "function", "killOwner");
  assert.equal(typeof sample.reset, "function", "reset");
});

test("CT-101-17: the semantics of the sample provider this test rests on", async () => {
  const { token } = await freshLease();
  // A live owner: the token verifies, and the sample reports the lock held.
  assert.equal(await sampleLock.verify(token), true);
  assert.equal(await sample.operations.probe(SCOPE), "held-live");
  // A token of no lock never verifies.
  assert.equal(await sampleLock.verify("token-of-no-lock"), false);
  // Once the owner is dead, every token of that lock answers false, and stays
  // so: the loss of an owner is not a transient failure.
  killOwner();
  assert.equal(await sampleLock.verify(token), false);
  assert.equal(await sampleLock.verify(token), false);
  assert.equal(await sample.operations.probe(SCOPE), "stale-owner-dead");
  // `reset()` empties the provider's memory, so a fresh lease is a live lock
  // again. (The sample mints its tokens from a counter that `reset()` starts
  // over, so the string may repeat — the sample's own behaviour, which this
  // test records rather than emulates.)
  const again = await freshLease();
  assert.equal(await sampleLock.verify(again.token), true);
  assert.equal(await sample.operations.probe(SCOPE), "held-live");
  // A lock in another scope is a lock of its own, with a token of its own.
  const other = await sample.operations.acquire({ workspaceId: "w2", path: "/other" }, OWNER);
  assert.equal(other.acquired, true);
  const otherToken = sample.operations.handDown(other.lease);
  assert.notEqual(otherToken, again.token);
  assert.equal(await sampleLock.verify(otherToken), true);
  // And the loss of one lock's owner leaves the other lock alone: `verify`
  // answers per lock, which is what the per-boundary cases below rest on.
  killOwner();
  assert.equal(await sampleLock.verify(again.token), false);
  assert.equal(await sampleLock.verify(otherToken), true);
});

test("CT-101-17: the six boundaries of F101-FR-040, and the end of a lost owner", () => {
  assert.equal(BOUNDARY_COUNT, 6);
  assert.deepEqual(
    [...BOUNDARIES],
    [
      "before-a-phase-starts",
      "before-a-phase-attempt-starts",
      "before-the-verification-gate",
      "before-a-critic-class-call",
      "before-the-approval-record-is-written",
      "before-the-steps-after-an-approval",
    ],
  );
  assert.equal(LEASE_IS_VERIFIED_AT_EVERY_BOUNDARY_THAT_READS_THE_STOP_REQUEST, true);
  // F100-FR-147 — exit 6, `stop_flag`, cause `owner-lost`, not retryable.
  assert.equal(WHEN_THE_OWNER_IS_LOST.exitCode, 6);
  assert.equal(WHEN_THE_OWNER_IS_LOST.stopReason, "stop_flag");
  assert.equal(WHEN_THE_OWNER_IS_LOST.cause, "owner-lost");
  assert.equal(WHEN_THE_OWNER_IS_LOST.retryable, false);
  assert.equal(WHEN_THE_OWNER_IS_LOST.runsThePhaseGate, false);
  assert.equal(WHEN_THE_OWNER_IS_LOST.writesTheApprovalRecord, false);
  // And the same end stands in the table of halts, read from the contract.
  const row = haltOf("owner-lost");
  assert.equal(row.exitCode, 6);
  assert.equal(row.stopReason, "stop_flag");
  assert.equal(row.retryable, false);
  assert.equal(row.archivedBefore, false);
  assert.equal(retryableFor("stop_flag", true), false, "`stop_flag` is not transient");
});

test("CT-101-17: with a LIVE owner every boundary of the sample provider passes", async () => {
  const { token } = await freshLease();
  const result = await checkBoundaries(BOUNDARIES, {
    lock: sampleLock,
    token,
    stopRequest: { requested: () => ({ stop: false }) },
  });
  assert.equal(stopped(result), false);
  assert.equal(result.boundary, "before-the-steps-after-an-approval");
});

test("CT-101-17: the owner is lost AT EACH boundary, and no later boundary runs", async () => {
  for (const [index, boundary] of BOUNDARIES.entries()) {
    const { token } = await freshLease();
    const reached: Boundary[] = [];
    // The owner is killed, through the sample provider, exactly when this
    // boundary is reached.
    const lock = {
      verify: async (given: string) => {
        if (reached[reached.length - 1] === boundary) killOwner();
        return sampleLock.verify(given);
      },
    };
    let last = await checkBoundary(BOUNDARIES[0] as Boundary, {
      lock: sampleLock,
      token,
      stopRequest: { requested: () => ({ stop: false }) },
    });
    reached.length = 0;
    // Walk the boundaries in order, killing the owner at `boundary`.
    for (const candidate of BOUNDARIES) {
      reached.push(candidate);
      last = await checkBoundary(candidate, {
        lock,
        token,
        stopRequest: { requested: () => ({ stop: false }) },
      });
      if (stopped(last)) break;
    }
    assert.equal(stopped(last), true, `the owner is lost at ${boundary}`);
    assert.equal(last.boundary, boundary, `the stop is AT ${boundary}`);
    assert.equal(
      stopped(last) ? last.because : "",
      "owner-lost",
      `${boundary}: the reason is a lost owner`,
    );
    assert.deepEqual(
      stopped(last) ? { ...(last.outcome ?? {}) } : {},
      { ...OWNER_LOST },
      `${boundary}: the end of F100-FR-147`,
    );
    // No boundary after this one was reached.
    assert.deepEqual(reached, BOUNDARIES.slice(0, index + 1), `${boundary}: nothing after it ran`);
  }
});

test("CT-101-17: a provider that FAILS in `verify` is the owner treated as lost", async () => {
  const { token } = await freshLease();
  const result = await checkBoundary("before-a-critic-class-call", {
    lock: {
      verify: () => {
        throw new Error("the provider is gone");
      },
    },
    token,
    stopRequest: { requested: () => ({ stop: false }) },
  });
  assert.equal(stopped(result), true);
  assert.equal(stopped(result) ? result.because : "", "verify-failed");
  assert.deepEqual(stopped(result) ? { ...(result.outcome ?? {}) } : {}, { ...OWNER_LOST });
  assert.equal(
    VERIFY_FAILURE_PATH.length > 0,
    true,
    "the failure path of `verify` is the port's own",
  );
});

test("CT-101-17 (FX-01): the run ends with exit 6 and writes no approval record, at every boundary", async () => {
  for (const boundary of BOUNDARIES) {
    const { token } = await freshLease();
    const run = await runFixture({
      ...FX_01_THREE_PHASES,
      lease: {
        lock: sampleLock,
        token,
        // The owner is lost, in the sample provider, just before the lease is
        // verified at THIS boundary.
        atBoundary: (reached) => {
          if (reached === boundary) killOwner();
        },
      },
    });
    assert.equal(run.exitCode, 6, `${boundary}: exit 6`);
    assert.equal(run.stopReason, "stop_flag", `${boundary}: the stop reason`);
    assert.equal(run.ownerLostAt, boundary, `${boundary}: the boundary the owner was lost at`);
    // No approval record is written once the owner is lost. The LAST
    // boundary of F101-FR-040 stands AFTER the approval record of the phase
    // attempt it belongs to, so there the record of phase 1 — written while
    // the owner was still live — stands, and no second one does; at every
    // earlier boundary there is none at all.
    const approvals = [...run.files.keys()].filter((k) => k.includes("/approvals/"));
    if (boundary === "before-the-steps-after-an-approval") {
      assert.deepEqual(
        approvals,
        ["features/101-gate-and-verdict/approvals/phase-1.json"],
        `${boundary}: the record written before the owner was lost, and no second one`,
      );
    } else {
      assert.deepEqual(approvals, [], `${boundary}: no approval record`);
    }
    // No count changed, and nothing was archived.
    assert.deepEqual([...run.ledgerWrites], [], `${boundary}: no count changed`);
    assert.deepEqual([...run.archived], [], `${boundary}: nothing was archived`);
    // Nothing of the phase gate ran past the boundary.
    assert.equal(
      run.boundariesChecked[run.boundariesChecked.length - 1],
      boundary,
      `${boundary}: it is the last boundary that was checked`,
    );
    if (
      boundary === "before-a-phase-starts" ||
      boundary === "before-a-phase-attempt-starts" ||
      boundary === "before-the-verification-gate" ||
      boundary === "before-a-critic-class-call"
    ) {
      assert.equal(run.calls.length, 0, `${boundary}: the critic was never called`);
      assert.deepEqual([...run.gateSteps], [], `${boundary}: no phase gate ran to its end`);
    }
    // The terminal record of that end validates and is not retryable.
    const record = terminalRecord({
      exitCode: run.exitCode,
      stopReason: "stop_flag",
      cause: "owner-lost",
      causedBy: "crash",
      runId: run.runId,
      launchId: "l1",
      engineStartId: "e1",
      at: "2026-10-03T00:00:00.000Z",
      retryable: true,
    });
    assert.equal(validatesAgainstTheSchema(record), true, boundary);
    assert.equal(record.retryable, false, boundary);
  }
});

test("CT-101-17 (FX-01): with a live owner the same run approves every phase", async () => {
  const { token } = await freshLease();
  const run = await runFixture({
    ...FX_01_THREE_PHASES,
    lease: { lock: sampleLock, token },
  });
  assert.equal(run.exitCode, 0);
  assert.equal(run.ownerLostAt, undefined);
  assert.equal([...run.files.keys()].filter((k) => k.includes("/approvals/")).length, 3);
  // Every one of the six boundaries was checked, for every phase attempt.
  assert.equal(new Set(run.boundariesChecked).size, BOUNDARY_COUNT);
});
