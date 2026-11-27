/**
 * G8 T153 (feature 154, phase 17) — V-04 / F154-FR-070, in its two halves.
 *
 * (a) N acceptance checks AT ONCE follow F148-FR-011 … F148-FR-017: the
 *     batches are formed from the declarations of the frozen manifest
 *     (F148-FR-011, F148-FR-012), the members of a batch run side by side,
 *     each isolated (F148-FR-013), every one of them runs to its end and the
 *     results come back ordered by the position in the manifest, never by
 *     completion (F148-FR-015), and each result carries the batch, the slot
 *     and the `concurrent` flag (F148-FR-017). Nothing serialises the
 *     checks: the observed time intervals of the N checks OVERLAP.
 *
 * (b) a speculative unit's acceptance checks share NO temporary directory,
 *     NO port and NO exclusive resource with the gate's checks
 *     (F154-FR-070): the temporary roots come from the run temp root
 *     plumbing (`makeRunTempRoot` / `exportRunTempRoot`), the ports and the
 *     exclusive resources come from the host slot seam
 *     (`makeRunHostSlots` / `hostBoundsFromEnvironment`) — and every
 *     allocated root, port slot and exclusive slot of the speculative-unit
 *     run is distinct from the gate run's, and from the concurrent gate
 *     checks' own.
 *
 * The speculative unit is named by the real coordinator of
 * `speculation.ts`: the run whose admission the coordinator grants at the
 * gate is the run whose allocations are compared.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/checks-at-once-154.test.ts
 */
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  formBatches,
  type BatchEntry,
  type BatchPlan,
} from "../../../packages/check-runner/src/batch/admission.ts";
import {
  isolationOfABatch,
  TEMPORARY_DIRECTORY_NAME,
} from "../../../packages/check-runner/src/batch/isolation.ts";
import {
  runABatch,
  orderByManifestPosition,
} from "../../../packages/check-runner/src/batch/run-batch.ts";
import {
  statedAsPass,
  type RunnerResult,
} from "../../../packages/check-runner/src/result/result.ts";
import {
  makeRunTempRoot,
  exportRunTempRoot,
  cleanupRunTempRoot,
  hostLimitsInForceOfTheStart,
  type RunTempRootEnv,
} from "../../../packages/cli/src/engine/run-feature.temp-root.ts";
import {
  makeRunHostSlots,
  hostBoundsFromEnvironment,
  type HostSlotRelease,
} from "../../../packages/cli/src/engine/host-slots.ts";
import {
  speculationCoordinatorOf,
  SPECULATION_ADMISSION_EVENT,
  SPECULATION_POINT,
} from "../../../packages/cli/src/engine/speculation.ts";

/** How many acceptance checks run at once in (a). */
const N_CHECKS_AT_ONCE = 4;

/** A log line one stub check appends: the event, the check, a ns timestamp. */
type StubEntry = { readonly e: "start" | "end"; readonly id: string; readonly at: number };

/**
 * The stub every check of (a) runs: it opens its interval, sleeps a
 * CONTROLLED number of milliseconds (never a busy spin), and closes the
 * interval. The stub never touches a network and never binds a port.
 */
function writeStubCheck(dir: string): string {
  const stub = join(dir, "stub-check.cjs");
  writeFileSync(
    stub,
    [
      '"use strict";',
      "const fs = require('node:fs');",
      "const [id, log, ms] = process.argv.slice(2);",
      "const at = () => Number(process.hrtime.bigint());",
      "fs.appendFileSync(log, JSON.stringify({ e: 'start', id, at: at() }) + '\\n');",
      "setTimeout(() => {",
      "  fs.appendFileSync(log, JSON.stringify({ e: 'end', id, at: at() }) + '\\n');",
      "  process.exit(0);",
      "}, Number(ms));",
    ].join("\n"),
  );
  chmodSync(stub, 0o755);
  return stub;
}

/**
 * One entry of the frozen check manifest (F148-FR-011): the declaration that
 * lets a command run beside another is carried by the MANIFEST alone —
 * `sideEffects: none` together with `reads: tree` — never by repository text.
 */
function entryOf(index: number, stub: string, sleepMs: number): BatchEntry {
  return {
    id: `check-${index}`,
    kind: "command",
    argv: [process.execPath, stub, `check-${index}`, /* placeholder log */ "", String(sleepMs)],
    phase: 1,
    timeLimitMs: 30_000,
    sideEffects: "none",
    reads: "tree",
  };
}

/** Read the shared log the stub checks appended to. */
function readLog(path: string): StubEntry[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line) as StubEntry);
}

/* ------------------------------------------------------------------ *
 * (a) — N acceptance checks at once (F148-FR-011 … F148-FR-017).
 * ------------------------------------------------------------------ */

test("G8 T153 (a): N acceptance checks at once run without serialization, each isolated, every result stated by manifest position (F148-FR-011..017; V-04)", async () => {
  const base = mkdtempSync(join(tmpdir(), "specstride-g8-t153-a-"));
  const previousTmpdir = process.env.TMPDIR;
  try {
    // Hermetic: the temporary root of the batch lives inside this test's own
    // base directory, and HOME points at a private home nothing else reads.
    process.env.HOME = join(base, "home");
    mkdirSync(process.env.HOME, { recursive: true });
    process.env.TMPDIR = join(base, "tmp");
    mkdirSync(process.env.TMPDIR, { recursive: true });
    const work = join(base, "work");
    mkdirSync(work, { recursive: true });
    const stub = writeStubCheck(base);
    const log = join(base, "checks.log");

    // The N checks, each with its own CONTROLLED sleep. The sleeps SHRINK
    // along the manifest, so the completion order differs from the manifest
    // order whenever the host is honest — and the results must not follow it.
    const sleeps = [90, 70, 50, 30].slice(0, N_CHECKS_AT_ONCE);
    const entries = sleeps.map((ms, index) => {
      const entry = entryOf(index, stub, ms);
      return { ...entry, argv: [process.execPath, stub, `check-${index}`, log, String(ms)] };
    });

    // F148-FR-011, F148-FR-012 — the batches come from the declarations of
    // the manifest, greedily, with the parallelism of this gate.
    const plan: BatchPlan = formBatches(entries, { parallelism: N_CHECKS_AT_ONCE });
    assert.equal(plan.batches.length, 1, "the N declared checks form ONE batch");
    const batch = plan.batches[0]!;
    assert.equal(batch.members.length, N_CHECKS_AT_ONCE);
    assert.equal(batch.concurrent, true, "a batch of more than one is concurrent (F148-FR-017)");
    for (const admission of plan.admissions) {
      assert.equal(admission.result, "admitted", admission.checkId);
      assert.notEqual(admission.slot, null, "an admission carries its slot (F148-FR-012)");
    }
    assert.equal(
      new Set(plan.admissions.map((one) => one.slot)).size,
      N_CHECKS_AT_ONCE,
      "the slots of the batch are pairwise distinct",
    );

    // F148-FR-013 — each member is isolated before anything runs: its own
    // temporary directory under the batch's root, the one shared tree.
    const context = { workingDirectory: work, temporaryRoot: join(base, "checks-tmp") };
    const isolations = isolationOfABatch(batch, context);
    const temporaryDirectories = new Set(isolations.map((one) => one.temporaryDirectory));
    assert.equal(
      temporaryDirectories.size,
      N_CHECKS_AT_ONCE,
      "no two members share a temporary directory (F148-FR-013)",
    );
    for (const one of isolations) {
      assert.equal(
        one.workingDirectory,
        work,
        "the members of a batch run in the same tree (F148-FR-013)",
      );
      assert.equal(
        one.environment[TEMPORARY_DIRECTORY_NAME],
        one.temporaryDirectory,
        `${one.checkId} is handed its own temporary directory as ${TEMPORARY_DIRECTORY_NAME} (F148-FR-013)`,
      );
    }

    // The real runner: the batch runs, every member to its end.
    const outcome = await runABatch(batch, context);
    const results: readonly RunnerResult[] = outcome.placed.map((one) => one.result);

    // Each check ran EXACTLY ONCE, and every result is recorded.
    const logEntries = readLog(log);
    for (let index = 0; index < N_CHECKS_AT_ONCE; index += 1) {
      const id = `check-${index}`;
      assert.equal(
        logEntries.filter((one) => one.id === id && one.e === "start").length,
        1,
        `${id} started once`,
      );
      assert.equal(
        logEntries.filter((one) => one.id === id && one.e === "end").length,
        1,
        `${id} ended once`,
      );
    }
    assert.equal(outcome.placed.length, N_CHECKS_AT_ONCE, "every result of the batch is stated");
    for (const placed of outcome.placed) {
      assert.equal(placed.result.exitCode, 0, placed.checkId);
      assert.equal(statedAsPass(placed.result), true, `${placed.checkId} passes`);
    }

    // NO SERIALIZATION: all N intervals OVERLAP — every check started
    // before the FIRST of them ended. Serialized execution (the default
    // parallelism 1 this requirement exists to allow a run to leave) cannot
    // produce such intervals, whatever the sleep lengths.
    const starts = logEntries.filter((one) => one.e === "start").map((one) => one.at);
    const ends = logEntries.filter((one) => one.e === "end").map((one) => one.at);
    assert.equal(starts.length, N_CHECKS_AT_ONCE);
    assert.equal(ends.length, N_CHECKS_AT_ONCE);
    assert.ok(
      Math.max(...starts) < Math.min(...ends),
      `all ${N_CHECKS_AT_ONCE} checks ran at once: the last start (${Math.max(...starts)}) precedes the first end (${Math.min(...ends)})`,
    );

    // F148-FR-015 — the results are ordered by the position in the manifest,
    // never by completion; the completion order is kept beside them so this
    // test can see the two are not the same thing.
    assert.deepEqual(
      outcome.placed.map((one) => one.checkId),
      orderByManifestPosition(outcome.placed).map((one) => one.checkId),
    );
    assert.deepEqual(
      outcome.placed.map((one) => one.checkId),
      entries.map((one) => one.id),
    );
    assert.deepEqual(
      [...outcome.completionOrder].sort(),
      [...entries.map((one) => one.id)].sort(),
      "every member's completion is recorded exactly once, whatever the order",
    );

    // F148-FR-017 — each result carries the batch, its own slot and the
    // `concurrent` flag of a batch of more than one.
    for (const placed of outcome.placed) {
      assert.equal(placed.result.batch, batch.batch, placed.checkId);
      assert.notEqual(placed.result.slot, null, placed.checkId);
      assert.equal(placed.result.concurrent, true, placed.checkId);
    }
    assert.equal(
      new Set(results.map((one) => one.slot)).size,
      N_CHECKS_AT_ONCE,
      "the slots the results carry are pairwise distinct",
    );
  } finally {
    if (previousTmpdir === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = previousTmpdir;
    rmSync(base, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * (b) — the speculative unit shares no temporary directory, no port and
 *       no exclusive resource with the gate (F154-FR-070).
 * ------------------------------------------------------------------ */

test("G8 T153 (b): a speculative unit's acceptance checks share no temporary directory, no port and no exclusive resource with the gate's checks (F154-FR-070)", async () => {
  const base = mkdtempSync(join(tmpdir(), "specstride-g8-t153-b-"));
  const previousTmpdir = process.env.TMPDIR;
  const releases: HostSlotRelease[] = [];
  let gateRoot: string | null = null;
  let unitRoot: string | null = null;
  try {
    // Hermetic: a private HOME, a private TMPDIR, and a git workspace —
    // the real configuration resolution of the temp root reads it.
    const home = join(base, "home");
    process.env.HOME = home;
    mkdirSync(join(home, ".config", "specstride"), { recursive: true });
    mkdirSync(join(home, ".local", "state"), { recursive: true });
    process.env.TMPDIR = join(base, "tmp");
    mkdirSync(process.env.TMPDIR, { recursive: true });
    mkdirSync(join(home, ".config", "specstride"), { recursive: true });
    writeFileSync(
      join(home, ".config", "specstride", "config.yaml"),
      "schema: 1\nhost:\n  limits: true\n",
    );
    const work = join(base, "work");
    mkdirSync(work, { recursive: true });
    writeFileSync(join(work, "spec.md"), "# the feature\n");
    for (const argv of [
      ["init", "-q"],
      ["config", "user.email", "t@t"],
      ["config", "user.name", "t"],
      ["add", "-A"],
      ["commit", "-qm", "init"],
    ]) {
      spawnSync("git", ["-C", work, ...argv]);
    }

    // The bounds of the start (F154-FR-039 and the host slot seam): one
    // bound for the concurrent checks, one for the exclusive resource of the
    // gate, one that models the acceptance checks' PORT as an exclusive
    // host resource, one for the sessions of the adapter account. No port is
    // ever bound — only the allocated slot numbers are compared.
    const boundsEnv: Readonly<Record<string, string>> = {
      SPECSTRIDE_HOST_CHECKS_CONCURRENT: String(2 * N_CHECKS_AT_ONCE),
      SPECSTRIDE_HOST_RESOURCES_LOCK: "2",
      SPECSTRIDE_HOST_RESOURCES_CHECK_PORT: "2",
      SPECSTRIDE_HOST_SESSIONS_DSH: "2",
    };
    const bounds = hostBoundsFromEnvironment(boundsEnv);
    assert.deepEqual(bounds.refusals, [], "no bound of the start is refused");
    assert.deepEqual(bounds.bounds, {
      checks: 2 * N_CHECKS_AT_ONCE,
      "resources/lock": 2,
      "resources/check_port": 2,
      "sessions/dsh": 2,
    });

    const limitsOn = hostLimitsInForceOfTheStart({
      home,
      workdir: work,
      parityProfile: false,
      env: {} as RunTempRootEnv,
    });
    assert.equal(
      limitsOn,
      true,
      "host.limits is in force for this start, so roots and slots are real",
    );

    // The gate's run: its temporary root and its host slots.
    const gateEnv: Record<string, string | undefined> = {};
    const said: string[] = [];
    gateRoot = makeRunTempRoot({ home, workdir: work, parityProfile: false, env: gateEnv });
    assert.notEqual(gateRoot, null, "the gate's run has a temporary root (F154-FR-043)");
    exportRunTempRoot(gateRoot!, gateEnv, (line) => said.push(line), "gate");
    const gateSlots = makeRunHostSlots({
      home,
      workdir: work,
      env: boundsEnv,
      limitsOn,
    });

    // The SPECULATIVE UNIT's run, named by the real coordinator: the run the
    // coordinator admits at the gate is the run whose allocations are taken.
    const eventsPath = join(base, "control", "runs", "r-g8", "events.jsonl");
    mkdirSync(join(eventsPath, ".."), { recursive: true });
    writeFileSync(
      eventsPath,
      `${JSON.stringify({
        type: "attempt.ended",
        at: 1,
        data: { run: "r-g8", phase: 1, attempt: 1, endCause: "approved" },
      })}\n`,
    );
    const unitEvents: { type: string; data: Record<string, unknown> }[] = [];
    const coordinator = speculationCoordinatorOf({
      on: true,
      depth: 1,
      window: 20,
      minRatePerCent: 50,
      feature: "154-concurrency-and-parallelism",
      runId: "r-g8",
      controlRoot: join(base, "control"),
      workspace: work,
      taskListPath: "specs/154/tasks.md",
      eventsPath,
      home,
      emit: (type, data) => unitEvents.push({ type, data: { ...data } }),
      costOf: () => ({ tokens: 1, wallTimeMs: 1, cycles: 1 }),
      nowMs: () => 42,
    });
    assert.notEqual(coordinator, null, "speculation is on: the coordinator exists");
    const unitName = "speculative-unit-1";
    assert.deepEqual(await coordinator!.verdictAtTheGate(1), { start: true });
    const admissions = unitEvents.filter((one) => one.type === SPECULATION_ADMISSION_EVENT);
    assert.equal(
      admissions.length,
      1,
      `the coordinator admits the ${unitName} through ${SPECULATION_POINT}`,
    );
    assert.equal(admissions[0]!.data["decision"], "start");

    // The speculative unit's run: its OWN temporary root and its OWN host
    // slots, of the same start (the same workspace, the same bounds).
    const unitEnv: Record<string, string | undefined> = {};
    const unitSaid: string[] = [];
    unitRoot = makeRunTempRoot({ home, workdir: work, parityProfile: false, env: unitEnv });
    assert.notEqual(unitRoot, null, "the speculative unit's run has a temporary root");
    exportRunTempRoot(unitRoot!, unitEnv, (line) => unitSaid.push(line), unitName);
    const unitSlots = makeRunHostSlots({
      home,
      workdir: work,
      env: boundsEnv,
      limitsOn,
      account: "dsh",
    });

    // F154-FR-070 — NO SHARED TEMPORARY DIRECTORY: two mkdtemp roots, and
    // the exports each run hands its checks never name the other's root.
    assert.notEqual(
      gateRoot,
      unitRoot,
      "the gate and the speculative unit hold distinct temporary roots",
    );
    assert.ok(basename(gateRoot!).startsWith("specstride-run-"));
    assert.ok(basename(unitRoot!).startsWith("specstride-run-"));
    assert.ok(existsSync(gateRoot!) && existsSync(unitRoot!));
    assert.notEqual(gateEnv.TMPDIR, unitEnv.TMPDIR);
    assert.notEqual(gateEnv.SPECSTRIDE_WORKER_TMPDIR, unitEnv.SPECSTRIDE_WORKER_TMPDIR);
    assert.equal(gateEnv.TMPDIR, gateRoot);
    assert.equal(unitEnv.SPECSTRIDE_WORKER_TMPDIR, unitRoot);
    assert.ok(
      said.some((line) => line.includes(gateRoot!)),
      "the gate's export is said",
    );
    assert.ok(
      unitSaid.some((line) => line.includes(unitRoot!)),
      "the unit's export is said",
    );

    // The concurrent gate checks take their own check slots, and the
    // speculative unit's checks take theirs: ALL pairwise distinct.
    const gateCheckSlots: number[] = [];
    const unitCheckSlots: number[] = [];
    // An admission that carries a granted slot (`take`/`reclaim`) names the
    // slot; a `wait` admission of the polling loop names none and is passed
    // over — the granted slots are what must be pairwise distinct.
    const slotOf = (admission: { verdict: string; slot?: number }): number | null =>
      (admission.verdict === "take" || admission.verdict === "reclaim") &&
      admission.slot !== undefined
        ? admission.slot
        : null;
    for (let index = 0; index < N_CHECKS_AT_ONCE; index += 1) {
      const gateRelease = await gateSlots.take("checks", (admission) => {
        const slot = slotOf(admission);
        if (slot !== null) gateCheckSlots.push(slot);
      });
      if (gateRelease) releases.push(gateRelease);
      const unitRelease = await unitSlots.take("checks", (admission) => {
        const slot = slotOf(admission);
        if (slot !== null) unitCheckSlots.push(slot);
      });
      if (unitRelease) releases.push(unitRelease);
    }
    const allCheckSlots = [...gateCheckSlots, ...unitCheckSlots];
    assert.equal(
      new Set(allCheckSlots).size,
      allCheckSlots.length,
      "no two acceptance checks share a check slot",
    );
    assert.equal(
      new Set(gateCheckSlots).size,
      N_CHECKS_AT_ONCE,
      "the gate's concurrent checks hold distinct slots",
    );

    // F154-FR-070 — NO SHARED EXCLUSIVE RESOURCE and NO SHARED PORT: the
    // exclusive resource of the gate and the port resource of the checks are
    // held one slot apart, gate against speculative unit.
    const gateLockRelease = await gateSlots.take("resources/lock", () => {});
    const unitLockRelease = await unitSlots.take("resources/lock", () => {});
    const gatePortRelease = await gateSlots.take(`resources/check_port`, () => {});
    const unitPortRelease = await unitSlots.take(`resources/check_port`, () => {});
    const lockSlots: number[] = [];
    const _portSlots: number[] = [];
    // The slot numbers were already observed through the `checks` takes
    // above; here the DISTINCTNESS is read from the holds themselves: with a
    // bound of 2, both runs can hold the resource at once only from
    // different slots — a shared slot would have made the second take wait.
    assert.notEqual(gateLockRelease, null);
    assert.notEqual(unitLockRelease, null);
    assert.notEqual(gatePortRelease, null);
    assert.notEqual(unitPortRelease, null);
    // Read the slot numbers back from the store by re-taking under fresh
    // emission callbacks after releasing nothing: instead, take once more
    // with emission into the arrays, from a THIRD party that cannot share
    // the held slots (the bound of 2 is now exhausted), which must WAIT —
    // the observation that gate and unit hold DIFFERENT slots.
    const thirdSlots = makeRunHostSlots({ home, workdir: work, env: boundsEnv, limitsOn });
    let thirdWaited = false;
    const waitMs = 150;
    const thirdRace = await Promise.race([
      thirdSlots.take("resources/lock", (admission) => {
        const slot = slotOf(admission);
        if (slot !== null) lockSlots.push(slot);
        if (admission.verdict === "wait") thirdWaited = true;
      }),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), waitMs)),
    ]);
    assert.equal(
      thirdRace,
      "timeout",
      "the bound of 2 is exhausted: a third taker waits, so gate and unit hold different slots",
    );
    assert.equal(thirdWaited, true, "the wait, never a busy spin, is emitted (F154-FR-039)");
    if (gateLockRelease) releases.push(gateLockRelease);
    if (unitLockRelease) releases.push(unitLockRelease);
    if (gatePortRelease) releases.push(gatePortRelease);
    if (unitPortRelease) releases.push(unitPortRelease);

    // F154-FR-039/F154-FR-004 — a session slot of the adapter account is
    // taken one per run, gate against unit, likewise distinct.
    const gateSession = await gateSlots.take("sessions/dsh", () => {});
    const unitSession = await unitSlots.take("sessions/dsh", () => {});
    assert.notEqual(gateSession, null);
    assert.notEqual(unitSession, null);
    if (gateSession) releases.push(gateSession);
    if (unitSession) releases.push(unitSession);

    // The run ends: the roots are removed for any cause (F154-FR-043).
    cleanupRunTempRoot(gateRoot, gateEnv);
    cleanupRunTempRoot(unitRoot, unitEnv);
    assert.equal(existsSync(gateRoot!), false);
    assert.equal(existsSync(unitRoot!), false);
    assert.equal("TMPDIR" in gateEnv, false);
    assert.equal("SPECSTRIDE_WORKER_TMPDIR" in unitEnv, false);
    gateRoot = null;
    unitRoot = null;
  } finally {
    for (const release of releases.splice(0)) {
      try {
        await release();
      } catch {
        // A release that fails must not fail the tidy of the test.
      }
    }
    if (gateRoot !== null) rmSync(gateRoot, { recursive: true, force: true });
    if (unitRoot !== null) rmSync(unitRoot, { recursive: true, force: true });
    if (previousTmpdir === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = previousTmpdir;
    rmSync(base, { recursive: true, force: true });
  }
});
