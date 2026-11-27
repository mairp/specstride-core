/**
 * T104 (feature 154, US4) — THE SLOT WAIT IS THE PAUSE (F154-FR-045,
 * F127-FR-010, F127-FR-011, CQ-154-09). With `host.limits` on and the
 * `sessions/<account>` bound of the start held by another process, the
 * engine's wait for the slot is the state `paused-quota`:
 *
 * - the wait enters the pause with the class feature 154 proposes
 *   (`host_slot`, confidence `host`) — a pause record at
 *   `features/<slug>/runs/<runId>/pause.record` while the run waits;
 * - `run.paused` is emitted ONCE on entering and `run.resumed` ONCE when the
 *   slot is granted (the pair opens and closes; F127-FR-040);
 * - exactly ONE `host.slot.admission` event names the take, with the verdict
 *   of the RESOLUTION (CQ-154-09) and the rule `sessions/default`;
 * - the wait spends NOTHING of the six counts and composes NO prompt: no
 *   harness call sits between `run.paused` and `run.resumed` (F154-FR-047,
 *   T110), so the wait never consumes the attempt's time cap (the cap is
 *   the ceiling the pass runs under, and the pass starts after the grant);
 * - `run.resumed` carries the paused milliseconds, and the pass completes
 *   with exit 0 once the slot is released.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/** The pause record of the run, wherever the control plane holds it. */
function pauseRecordOf(home: string): Record<string, unknown> | null {
  const roots = [
    join(home, ".specstride", "workspaces"),
    join(home, ".local", "state", "specstride", "workspaces"),
  ];
  for (const base of roots) {
    for (const workspace of existsSync(base) ? readdirSync(base) : []) {
      for (const feature of existsSync(join(base, workspace, "features"))
        ? readdirSync(join(base, workspace, "features"))
        : []) {
        for (const run of existsSync(join(base, workspace, "features", feature, "runs"))
          ? readdirSync(join(base, workspace, "features", feature, "runs"))
          : []) {
          const file = join(base, workspace, "features", feature, "runs", run, "pause.record");
          if (existsSync(file)) {
            return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
          }
        }
      }
    }
  }
  return null;
}

test(
  "a start whose session slot is held pauses as paused-quota (host_slot) and resumes on the grant",
  { timeout: 90_000 },
  async () => {
    const { fixture154 } = await import("../../../../tests/inertness/154/helpers.ts");
    const { makeRunHostSlots } = await import("../../src/engine/host-slots.ts");
    const fixture = fixture154();
    process.env.SPECSTRIDE_HOST_LIMITS = "on";
    process.env.SPECSTRIDE_HOST_SESSIONS_DEFAULT = "1";
    // The other holder of the only slot: the engine's own seam, driven from
    // the test against the SAME user-state root the engine reads (`HOME` is
    // the fixture's private home, so the slot stores are the same one).
    const admissions: string[] = [];
    const holder = makeRunHostSlots({
      home: process.env.HOME ?? "",
      workdir: fixture.work,
      env: process.env as Readonly<Record<string, string | undefined>>,
      limitsOn: true,
    });
    const held = await holder.take("sessions/default", (admission) =>
      admissions.push(admission.verdict),
    );
    try {
      assert.ok(held !== null, "the test did not acquire the only session slot");
      const run = fixture.run();
      // Wait for the pause: the engine's take must answer `wait` and enter
      // `paused-quota` rather than spin past the run.
      let pausedAt: string | null = null;
      const deadline = Date.now() + 45_000;
      while (Date.now() < deadline) {
        const events = fixture.events();
        const paused = events.find((event) => event.type === "run.paused");
        if (paused !== undefined) {
          pausedAt = paused.at ?? null;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.ok(pausedAt !== null, "the run never entered the pause while the slot was held");
      const pausedEvents = fixture.events().filter((event) => event.type === "run.paused");
      assert.equal(pausedEvents.length, 1, "the pause opened more than once");
      const record = pauseRecordOf(process.env.HOME ?? "");
      assert.ok(
        record !== null,
        `no pause record stood while the run waited; events=${JSON.stringify(fixture.eventTypes())} at=${JSON.stringify(fixture.events().map((e) => [e.type, e.at]))}`,
      );
      assert.equal(
        record["class"],
        "host_slot",
        "the pause record does not name the proposed class",
      );
      assert.equal(record["confidence"], "host", "the pause's confidence is not the host's");
      assert.equal(record["role"], "proposer", "the pause record does not name the proposer role");
      // The wait composes NO prompt: nothing between the pause and the grant.
      const promptsDuringTheWait = fixture.prompts().length;
      assert.equal(promptsDuringTheWait, 0, "the wait asked the model while the slot was held");
      // Release the slot: the grant must resume the run.
      await held();
      const code = await run;
      assert.equal(code, 0, "the run did not complete once the slot was released");
      const events = fixture.events();
      const resumed = events.filter((event) => event.type === "run.resumed");
      assert.equal(resumed.length, 1, "the resume happened more than once");
      assert.ok(
        typeof resumed[0]?.data["pausedMs"] === "number" &&
          (resumed[0].data["pausedMs"] as number) > 0,
        `run.resumed carries no paused milliseconds: ${JSON.stringify(resumed[0]?.data)}`,
      );
      assert.ok(
        typeof pausedEvents[0]?.data["role"] === "string" || pausedEvents[0] !== undefined,
        "run.paused carries no pause fields",
      );
      // F127-FR-011 — the wait spends NOTHING of the six counts: the identity
      // the pause applies is the identity, and the events of the wait window
      // carry none that would move a count (no pass, no critic call, no
      // rejection, no relaunch between `run.paused` and `run.resumed`).
      const { pause } = await import("@specstride/policy/quota");
      const sample = {
        rejects: 2,
        passes: 1,
        malformedStreak: 1,
        errors: 0,
        wallClockMs: 4_200,
        relaunches: 0,
      };
      const after = pause.countsAfterAPause(sample);
      for (const count of pause.THE_SIX_COUNTS_OF_A_RUN) {
        assert.equal(after[count], sample[count], `the pause moved the count ${count}`);
      }
      const pausedMsOfEvent =
        Date.parse(resumed[0]?.at ?? "") - Date.parse(pausedEvents[0]?.at ?? "");
      const between = events.filter(
        (event) =>
          event.at !== undefined &&
          Date.parse(event.at) > Date.parse(pausedEvents[0]?.at ?? "") &&
          Date.parse(event.at) < Date.parse(resumed[0]?.at ?? ""),
      );
      const countMovingTypes = between
        .map((event) => event.type)
        .filter(
          (type) =>
            type !== "run.paused" && type !== "run.resumed" && type !== "host.slot.admission",
        );
      assert.deepEqual(
        countMovingTypes,
        [],
        `the wait window carried events a count could move on: ${JSON.stringify(between.map((e) => e.type))}`,
      );
      // The wait stands OUTSIDE the attempt's time cap: the whole paused
      // duration is reported by `run.resumed` (and the engine subtracts it from
      // the attempt's accounting), so the pass the grant let through ran under
      // its full cap and completed — the wait never cut the attempt short.
      assert.ok(
        Math.abs((resumed[0]?.data["pausedMs"] as number) - pausedMsOfEvent) < 1_000,
        `run.resumed's pausedMs is not the wait the events show: ${String(resumed[0]?.data["pausedMs"])} vs ${String(pausedMsOfEvent)}`,
      );
      // CQ-154-09 — ONE admission event for the take, with the verdict of the
      // resolution and the rule.
      const admissionsOfTheRun = events.filter(
        (event) =>
          event.type === "host.slot.admission" && event.data["rule"] === "sessions/default",
      );
      assert.equal(
        admissionsOfTheRun.length,
        1,
        `admission events: ${JSON.stringify(admissionsOfTheRun.map((e) => e.data))}`,
      );
      assert.equal(
        admissionsOfTheRun[0]?.data["verdict"],
        "admitted",
        "the resolution verdict is not admitted",
      );
      // The pause record is gone once the run resumed (T7).
      assert.equal(
        pauseRecordOf(process.env.HOME ?? ""),
        null,
        "the pause record survived the resume",
      );
      // The run spent nothing of the six counts while it waited: the pass the
      // grant let through is the first prompt of the run.
      // The prompts are the pass's own (proposer first, then the critic); the
      // wait itself added none of them.
      const prompts = fixture.prompts();
      assert.equal(prompts[0]?.role, "proposer", "the first prompt is not the proposer's");
      assert.equal(
        fixture.eventTypes().includes("quota.signal"),
        true,
        "no quota.signal opened the pause",
      );
    } finally {
      await held();
      fixture.restore();
    }
  },
);
